const catchAsync=require('../utils/catchAsync');
const User=require('../models/userModel');
const APIFeatures=require('../utils/apiFeatures');
const AppError=require('../utils/appError');
const factory=require('./handlerFactory');
const multer =  require('multer'); // thư viện upload ảnh
const sharp =  require('sharp'); // thư viện resize và lưu ảnh




//BEGIN upload file ảnh user -- qua middleware này thì req object sẽ có thêm req.file
/*lưu ý req.file = file trong destination và filename,multerFilter
req.file vì upload.single('photo') chỉ up 1 ảnh

khi upload file thì req.file bằng multer.diskStorage:
{
  fieldname: 'photo',
  originalname: 'leo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'public/img/users',
  filename: 'user-5c8a1f292f8fb814b56fa184-1664017202050.jpeg',
  path: 'public\\img\\users\\user-5c8a1f292f8fb814b56fa184-1664017202050.jpeg',
  size: 207078
}

khi upload file thì req.file bằng multer.memoryStorage:
{
  fieldname: 'photo',
  originalname: 'user-5c8a21f22f8fb814b56fa18a-1664028333322.jpeg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: <Buffer ff d8 ff db 00 43 00 06 04 05 06 05 04 06 06 05 06 07 07 06 08 0a 10 0a 0a 09 09 0a 14 0e 0f 0c 10 17 14 18 18 17 14 16 16 1a 1d 25 1f 1a 1b 23 1c 16 ... 29676 more bytes>,
  size: 29726
}
*/

// const multerStorage = multer.diskStorage({ // ảnh lưu trong ổ cứng
//     destination: (req,file,cb) =>{//destination là 1 callback function, so that callback function has access to the current request, to the current uploaded file and callback function(cb), lưu ý cb giống next() nhưng khác tên gọi
//         cb(null,'public/img/users') // tham sô 1 là error không có thì null, tham số thứ 2 là địa chỉ lưu ảnh
//         //cb(null,'public/img/users'): 'public/img/users'  ảnh được upload lên sẽ được lưu trong địa chỉ này
//     },
//     filename: (req,file,cb) =>{  //filename là 1 callback function
//         //give our file some unique filenames theo cú pháp user-userid-the current timestamp. Vd user-62aad13123-36662626.jpeg
//         //step 1:extract the filename from the upload file (trích xuất tên tệp từ tệp tải lên)
//         const ext = file.mimetype.split('/')[1] //mimetype: 'image/jpeg', chỉ lấy jpeg
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}` ) // `user-${req.user.id}-${Date.now()}.${ext}` ảnh sẽ có tên

//     }
// });

const multerStorage = multer.memoryStorage(); //ảnh lưu trong buffer(lưu trong bộ nhớ)


const multerFilter = (req,file,cb)=>{// this function test the uploaded file is an image, and if it's image, then we pass true into the callback function (cb), if not we will pass false along with error
    if(file.mimetype.startsWith('image')){ //startsWith trả kết quả là boolean
        // trường hợp file upload là ảnh 
        cb(null,true)
    }
    else{
        cb(new AppError('Not an image! Please upload only image.',400),false)
    }
}

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

exports.uploadUserPhoto = upload.single('photo'); // upload.single chỉ muốn upload 1 ảnh, into single we pass the name of field that is going to hold the image to upload, Anh with field it mean the field in the form that is going to be uploading the image, có thể hiểu field đang nói đến ở đây là field photo ở UserMode và name photo trong thẻ input ben account.pug
/*upload.single('photo'): this midleware will take care of talking the file and basically copying it to destination that we specified and then after that of course it will call the next middleware in stack which is UpdateMe,
middleware: upload.single('photo') will put the file or at least some  information about the file on the req object
*/
//END upload file ảnh user



//RESIZE IMAGE USER
exports.resizeUserPhoto = catchAsync(async (req,res,next) =>{
    console.log(req.file)


    // Nếu không có file ảnh thì đi đến middleware tiếp theo
    if(!req.file) return next()

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg` //khai báo req.file.filname để exports.updateMe có thể dùng được req.file.filename

    await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quanlity:90}).toFile(`public/img/users/${req.file.filename}`); // chỉnh lại ảnh có kích thước 500x500 và có định dạng jpeg, jpeg({quanlity:90}) chất lượng hình ảnh: 90%
    //sharp(req.file.buffer).resize(500,500)... return ra promise
    next(); // gọi đến midleware tiếp theo
});


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };

//cách 1: getAllUsers
// exports.getAllUsers=catchAsync(async (req,res,next)=>{
//     const features=new APIFeatures(User.find(), req.query);
//     features.filter().sort().limitFields().paginate();
//     const users=await features.query;

//     res.status(200).json({
//         status:'success',
//         data:{
//             users:users
//         }
//     })
// });

//cách 2: getAllUsers
exports.getAllUsers=factory.getAll(User);


//cách 1 getUser
// exports.getUser=async (req,res,next)=>{
//     const user =await User.findById(req.params.id)
//     res.status(200).json({
//         status:'success',
//         data:{
//             user
//         }

//     })
// }

//cách 2 getUser
exports.getUser=factory.getOne(User);

//CreateUser
exports.createUser=factory.createOne(User);

//Admin
exports.updateUser=factory.updateOne(User);

//User
exports.updateMe= catchAsync(async (req,res,next)=>{
    //1 Create error if user POSTs password data
    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password update. Please use /updateMyPassword',400));
    };

    //2 Filter out unwanted fields names that allowed to be updated, những field cho phép được sửa, filterObj: chỉ cho phép sửa name, email
    const filterBody = filterObj(req.body, 'name','email'); //filterBody = { name: 'Sophie Louise Hart 1' }
    if(req.file){
        filterBody.photo = req.file.filename //filterBody.photo vì upload.single('photo')
    }

    //3 Update user documnet
    const updateUser = await User.findByIdAndUpdate(req.user.id,filterBody,{ // update theo id và nội dung update là filterBody, req.user.id lấy từ middleware protect
        new: true,
        runValidators: true //runValidators nếu dữ liệu nhập vào không đúng với kiểu dữ liệu khai trong schema thì rơi vào catch
    });

    res.status(200).json({
        status:'success',
        data :{
            user:updateUser
        }
    });
});

exports.getMe = (req,res,next) =>{
    req.params.id = req.user.id  //req.user.id được thêm vào từ authController.protect trong route router.get('/me',authController.protect,userController.getMe)
    next();
}

exports.deleteMe=catchAsync(async (req,res,next)=>{
    console.log(req.user.id);
    await User.findByIdAndUpdate(req.user.id, {active:false})

    res.status(200).json({
        status:'success',
        data:null

    })
});


exports.deleteUser = factory.deleteOne(User);


