//const fs=require('fs');
const Tour=require('../models/tourModel'); // import model tour từ folder model
const APIFeatures=require('../utils/apiFeatures');
const catchAsync=require('../utils/catchAsync');
const AppError=require('../utils/appError');
const factory=require('./handlerFactory');
const multer =  require('multer'); // thư viện upload ảnh
const sharp =  require('sharp'); // thư viện resize và lưu ảnh

//BEGIN upload file ảnh user -- qua middleware này thì req object sẽ có thêm req.file
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

exports.uploadTourImage = upload.fields([
    {name:'imageCover', maxCount:1}, //field imageCover trong Tour Model chỉ chứa 1 ảnh
    {name:'images',maxCount:3} //field images trong Tour Model sẽ chứa 3 ảnh
]);

//END upload file ảnh user


//RESIZE image tour
exports.resizeTourImages =catchAsync(async (req,res,next) =>{
    //console.log(req.files) // req.files vì  upload.fields, upload nhiều ảnh, trả 1 imageCover: [{....}], images: [{...},{...},{...},...] 

    if(!req.files.imageCover || !req.files.images) return next();

    //1 Image Cover
    const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg` // vì trong route updateTour có id tour nên dùng req.params.id
    await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quanlity:90}).toFile(`public/img/tours/${imageCoverFilename}`); // toFile(`public/img/tours/${imageCoverFilename}`); lưu file ảnh vào đường dẫn
    req.body.imageCover=imageCoverFilename; // req.body.imageCover vì trong Tour Model có field imageCover

    //2 Images
    req.body.images=[] // gán mảng rỗng vì trq.files.images trả ra images: [{...},{...},{...},...]
    
    // await Promise.all(req.files.images.map(async (file,index) =>{
    //     const filename = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
    //     await sharp(file.buffer).resize(2000,1333).toFormat('jpeg').jpeg({quanlity:90}).toFile(`public/img/tours/${filename}`); // toFile(`public/img/tours/${imageCoverFilename}`); lưu file ảnh vào đường dẫn
    //     req.body.images.push(filename) // mỗi lần lập qua các phần tử sẽ đẩy vào mảng req.body.image=[]
    // }));


    const arrayPromise = await req.files.images.map(async (file,index) =>{ //req.files.images.map trả ra 1 mảng gồm các phần tử là promise vì async (file,index) return ra promise, sau đó 1 mảng gồm các phần tử là promise sẽ được lưu vào biến arrayPromise 
        const filename = `tour-${req.params.id}-${Date.now()}-${index+1}.jpeg`;
        await sharp(file.buffer).resize(2000,1333).toFormat('jpeg').jpeg({quanlity:90}).toFile(`public/img/tours/${filename}`); // toFile(`public/img/tours/${imageCoverFilename}`); lưu file ảnh vào đường dẫn
        req.body.images.push(filename) // mỗi lần lập qua các phần tử sẽ đẩy vào mảng req.body.image=[]
    });

    console.log(arrayPromise);
    //chờ thực hiện hệt các promise mới qua các middleware tiếp theo 
    await Promise.all(arrayPromise);
    
    next();
})





//const tours=JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)); // tours là 1 mảng gồm n phần từ object - không cần dùng nữa

//export tất cả function

// exports.checking=(req,res,next,val)=>{ // không cần nữa
//     console.log(`Tour id:${val}`);
//     if(Number(req.params.id)>tours.length) {
//         return res.status(404).json({
//             status:'Fail',
//             message:'invalid ID'
//         });
//     };
//     next();
// }

// exports.middleware=(req,res,next)=>{
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json({
//             status:'fail',
//             message:'Missing name or price'
//         })
//     }
//     next();
// }

exports.aliasTopTours=(req,res,next)=>{
    //Gán giá trị cho top 5 cheap tours
    //thông thường limit,sort,field nằm trên đường link url, nhưng client truy cập trực tiếp vào url: /api/v1/tours/top-5-cheap nên set sẵn các thuộc tính đó
    req.query.limit='5';
    req.query.sort='-ratingsAverage,price' //-ratingsAverage: lấy từ cao-->thấp, price: lấy từ thấp đến cao
    req.query.fields='name,price,ratingsAverage,summary,difficulty';
    next();
}



//cách 1 getAllTours
exports.getAllTours=catchAsync(async (req,res,next)=>{
        //console.log(req.query); // req.query(tham số trên url) trả ra object dạng javascript -->{ duration: '4', maxGroupSize: '10', difficulty: 'difficult' }

        //cách 0: Tour.find({}).then(()=>{})  <==> const tours=await Tour.find();
       
        
        //cách 1: const tours=await Tour.find(req.query); // lấy tất cả data trong collection tour, Tour.find(bản thân Tour.find cũng là promise) return promise nên dùng await và dùng biến tours để lưu kết quả trả về là 1 mảng gồm các object chứa thông tin các tour
        
        /*cách 2:diễn giải theo cách trên 
        // const tours=await Tour.find({
        //     duration:5,
        //     difficulty:'easy'
        // })
        */
        
       //cách 3: const tours=await Tour.find().where('duration').equals(5).where('difficulty').equals('easy'); // lấy data theo điều kiện bằng method mongoose
       
       /*
        {difficulty:'easy',duration:{$gte:5}} muốn dùng toán tử(>,<,=,>=,..) thì phải dùng trong {} , $gte là >= ,$ kí hiệu của mongoDB
       */


       //BUILD QUERY
       //1.a Advance filter - url có toán tử >,<,=,>=,<=,...
       //url :127.0.0.1:3000/api/v1/tours?duration[gt]=5&difficulty=easy

        // let queryStr=JSON.stringify(req.query) // chuyển object dạng javascript sang JSON , typeof queryStr --> String , -->{"difficulty":"easy","duration":{"gt":"5"}}
        // queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g,(match)=>{ // match là gte,gt,lte,lt, \b(gte|gt|lte|lt)\b nếu trong chuỗi có chính xác những từ này từ sẽ vào callback
        //     return `$${match}`
        // });

        //nếu trong query có những chính xác những từ gte|gt|lte|lt thì sẽ được thêm dấu $ vào trước những từ này

        //Sau khi qua hàm repalce --> queryStr={"difficulty":"easy","duration":{"$gt":"5"}}

        //let query=Tour.find(JSON.parse(queryStr)); // trong find() phải là kiểu dữ liệu của javascript, JSON.parse(queryStr) --> { difficulty: 'easy', duration: { '$gt': '5' } }
        /* Tóm tắt 
        1. client request url :127.0.0.1:3000/api/v1/tours?duration[gt]=5&difficulty=easy
        2. Tại server req.query --> { difficulty: 'easy', duration: { gt: '5' } } , không có dấu toán tử của mongodb $gt
        3. chuyển object sang dạng json -->{"difficulty":"easy","duration":{"gt":"5"}}(dạng JSON)
        4. dùng hàm replace để thêm dấu $ và-->{"difficulty":"easy","duration":{"$gt":"5"}}(dạng JSON)
        */

        
        //1.b Basic filter
        //url: 127.0.0.1:3000/api/v1/tours?name=The Park Camper
        //console.log(req.query) -->object(javascript):{ name: 'The Park Camper' }
        //const query=Tour.find(req.query); // Tour.find() sẽ return ra Query => Tour.find() return ra Query(object Query - gồm các thuộc tính mà mongoose thiết lập)
    
        
        //2 Sort --sắp xếp theo
        // if(req.query.sort){
        //     //url: 127.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage
        //     //nếu console.log(req.query) thì trả lên object, nếu console.log(req.query.sort) --> trả ra string
        //     // console.log(req.query.sort); --> price,ratingsAverage
        //     const sortBy = req.query.sort.split(',').join(' ');
        //     //console.log(sortBy);  -->price ratingsAverage
        //     query=query.sort(sortBy); //biến query trên phần Advance filter , query.sort() return 1 object Query
        //     //sort('price ratingsAverage') --> cú pháp nếu sort theo 2 hoặc nhiều trường trở lên
            
        // }
        // else{
        //     query=query.sort('-createAt');
        // }

        //3 Field limiting -- lấy ra các trường mong muốn
        //url:127.0.0.1:3000/api/v1/tours?fields=name,duration
        //console.log(req.query.fields); --> name,duration (string)
        // if(req.query.fields){
        //     const fields=req.query.fields.split(',').join(' ');
        //     query=query.select(fields);
        // }
        // else{
        //     query=query.select('-__v') //mặc định loại bỏ trường __v khi response lại client vì là (-__v) còn nếu là select(__v) thì chỉ response trường __v 
        // }


        //4 Pagination - Sự phân trang
        // const page=Number(req.query.page) || 1; // ||1: 1 là giá trị mặc định
        // const limit=Number(req.query.limit) || 100; // ||100 --> có giá trị mặc định là 100
        // //1-10 page 1, 11-20 page 2, 21-30 page 3,... nên page=3&limit=10 ==> skip(20).limit(10), vì page 3 nên bắt đầu từ 21 ==> skip(bỏ qua) 20 dữ liệu đầu tiên, limit(10) giới hạn mỗi trang bao nhiêu dữ liệu
        // const skip =(page-1)*limit;
        // query=query.skip(skip).limit(limit) 

        // if(req.query.page){
        //     const numberTours=await Tour.countDocuments();//Tour.countDocuments return ra promise, mà có await nên đợi promise thực hiện xong rồi trả ra số lượng tour
        //     //nếu skip dữ liệu nhiều hơn dữ liệu hiện có thì throw ra lỗi
        //     if(skip >= numberTours) throw new Error('This page not exists'); // nếu lọt vào throw new error trong try block thì nó sẽ ngay lập tức vào catch block
        // }

        //EXECUTE QUERY
        //console.log(req.query); khi không có tham số (params) trên url thì req.query = {}, khi có tham số (params) trên url thì req.query = {name: 'The Snow Adventurer'}
        const features=new APIFeatures(Tour.find(), req.query) // new APIFeatures(Tour.find(), req.query) sẽ trả ra 1 object APIFeatures, trong object APIFeatures có object Query được lưu vào biến query(query là biến được khai báo trong class APIFeatures và được nhận giá trị thông qua đối số được truyền vào)
        // có thể viết: const features=new APIFeatures(Tour, req.query) // new APIFeatures(Tour.find(), req.query) sẽ trả ra 1 object APIFeatures, trong object APIFeatures có object Query được lưu vào biến query(query là biến được khai báo trong class APIFeatures và được nhận giá trị thông qua đối số được truyền vào)
        features.filter().sort().limitFields().paginate(); // đoạn code này vẫn trả ra 1 object APIFeatures
        const tours=await features.query; // features.query trả ra object Query, thực thi Query để trả ra dữ liệu
        //SEND RESPONSE
        res.status(200).json({
            status:'success',
            result: tours.length,
            data:{
                tours:tours,
            }
        });
    /* Tóm lại
    Promise là 1 object
    -const tours=await Tour.find();
    +Tour.find: bản thân là promise và return ra promise là 1 object Query chứa thuộc tính mà mongoose thiết lập
    +await Tour.find(): thực thi object Query mà Tour.find return ra để trả về 1 mảng gồm các object(javascript) chứa thông tin của các tour và dùng biến tours để lưu mảng đó
    */
});

//cách 2 getAllTours
//exports.getAllTours = factory.getAll(User);





//cách 1 getTour
// exports.getTour=catchAsync(async (req,res,next)=>{
//     //console.log(req.params.id);
//     const features=new APIFeatures(Tour.findById(req.params.id));
//     //EXECUTE QUERY
//     const tours=await features.query.populate('reviews'); //guides là field bên tourModel, khi thực hiện truy vấn thì trường guides sẽ tự động điền các user

//     //cách 1 sử dụng populate
//     //const tours=await features.query.populate('guides'); //guides là field bên tourModel, khi thực hiện truy vấn thì trường guides sẽ tự động điền các user
    
//     //cách 2 sử dụng populate
//     // const tours=await features.query.populate({//guides là field bên tourModel, khi thực hiện truy vấn thì trường guides sẽ tự động điền các user
//     //     path:'guides',
//     //     select: '-__v' // loại field -__v ở object User trong field guides
//     // });

//     //cách 3 sử dụng middleware query bên tourModel để tự động thực hiện khi sử dụng các method bắt đầu bằng từ find bên tourController


//     if(!tours){ // nếu không tồn tại ID hợp lệ trong database thì kết quả tours trả về sẽ là null nên lọt vào if, nếu ID không hợp lệ sẽ lọt vào catch trong file catchAsync.js
//         return next(new AppError('No tour found with that ID',404)); // return để thoát ra
//     }

//     res.status(200).json({
//         status:'success',
//         message: {
//             tours:tours
//         }
//     });


//     //req.params.id --> .id vì bên tourRoutes để tham số ../:id nếu ../:name thì req.params.name
//     //console.log(req.params);//req.params(object) là nơi tất cả các tham số (ví dụ :id trên url /api/v1/users/:id ) được lưu vào -->{ id: '5' }, không cần sử dụng middleware express.json()
//     //     const tour=await Tour.findById(req.params.id).populate('guides');//Tour.findById return ra promise và dùng biến tour để lưu kết quả trả về là 1 object
//     //     //Tour.findOne({_id:req.params.id}) = Tour.findById(req.params.id) --> tham số _id thì tự tạo ra trong mongdb
//     // if(!tour){ // nếu không tồn tại ID hợp lệ trong database thì kết quả tours trả về sẽ là null nên lọt vào if, nếu ID không hợp lệ sẽ lọt vào catch trong file catchAsync.js
//     //     return next(new AppError('No tour found with that ID',404)); // return để thoát ra
//     // }
//     //     res.status(200).json({
//     //         status:'success',
//     //         message: {
//     //             tour:tour
//     //         }
//     //     })
// });

// cách 2 của getTour
exports.getTour=factory.getOne(Tour,{path:'reviews'});


exports.createTour=catchAsync(async(req,res,next)=>{ // hàm catchAsync return ra hàm vô danh sau đó gán vào createTour, khi tạo mới tour thì hàm vô danh đó sẽ được gọi, cần tham số next để gọi đến global error handling middleware
    //tự làm create tour có upload ảnh
    // const imageCoverFilename = `tour-${req.user.id}-${Date.now()}-cover.jpeg` // vì trong route updateTour có id tour nên dùng req.params.id
    // await sharp(req.files.imageCover[0].buffer).resize(2000,1333).toFormat('jpeg').jpeg({quanlity:90}).toFile(`public/img/tours/${imageCoverFilename}`); // toFile(`public/img/tours/${imageCoverFilename}`); lưu file ảnh vào đường dẫn 
    // req.body.imageCover=imageCoverFilename; // req.body.imageCover vì trong Tour Model có field imageCover
    //--------------


    const features=new APIFeatures(Tour.create(req.body)); // khi tạo tour không cần truyển đối số thứ 2 cho class APIFeatures, ko dùng được features.filter().sort().limitFields().paginate(); vì tạo mới ko có lọc hay sắp xếp 
    //ko dùng được features.filter().sort().limitFields().paginate(); vì tạo mới ko có dùng được, chỉ khi muốn lấy thông tin sẵn có mới dùng
    //create , update, delete thì không cần truyền đối số thứ 2 cho class APIFeatures
    
    const tours=await features.query; // data lưu vào biến tours là 1 object chứa thông tin của tour vừa mới tạo

    res.status(200).json({
        status:'success',
        message: {
            tours:tours
        }
    });

    /*Lý giải cách hoạt động
    Khi lọt vào được tuyến đường(url) bên route router.route('/:id').get(tourController.getTour), middleware-tourController.getTour sẽ được gọi để thực hiên, chú ý middleware phải là 1 hàm
    catchAsync return ra 1 hàm là  (req,res,next) => {} và hàm này sẽ được gọi và thực thi --> hàm fn cũng được thực thi , trong đó tham số req của hàm được return từ catchAsync chứa thông tin được gửi từ client lên, cho nên tham số req của hàm fn cũng chứa các thông tin đó
    */

    // try{
    //     const newTour =await Tour.create(req.body);//Tour.create trả về promise, dùng biến newTour để lưu kết quả trả về là 1 object(dạng javascript chứa thông tin của tour được request bỏi client),Tour.create(req.body): tạo dữ liệu từ req của client
    //     console.log(newTour);
    //     res.status(201).json({
    //         status:'success',
    //         data:{
    //             tour:newTour
    //         }
    //     });
    // }
    // catch(err){
    //     res.status(400).json({
    //         status:'fail',
    //         message:'Invalid data sent'
    //     })
    // }
});

//cách 2 của create tour
// exports.createTour = factory.createOne(Tour)


exports.updateTour=catchAsync(async (req,res,next)=>{ //hàm async return promise
    //console.log(req.body); --> { name: 'The Sea Explorer 1' }
    const features=new APIFeatures(Tour.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}));//runValidators nếu dữ liệu nhập vào không đúng với kiểu dữ liệu khai trong schema thì rơi vào catch
    const tours=await features.query;

    if(!tours){ // nếu không tồn tại ID hợp lệ trong database thì sẽ tạo ra lỗi
        return next(new AppError('No tour found with that ID',404)); // return để thoát ra
    }

    res.status(200).json({
        status:'success',
        message: {
            tours:tours
        }
    });

    // try{
    //     //console.log(req.params); //-->{ id: '62d2755537022ea53d2d73e2' }
    //     const tour=await Tour.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});//runValidators nếu dữ liệu nhạp vào không đúng với kiểu dữ liệu khai trong schema thì rơi vào catch
    //     res.status(201).json({
    //         status:'success',
    //         data:{
    //             tour:tour
    //         }
    //     })
    // }
    // catch(err){
    //     res.status(400).json({
    //         status:'fail',
    //         message:err
    //     })
    // }
});

//cách 2 của update tour
// exports.deleteTour = factory.updateOne(Tour)


exports.deleteTour=catchAsync(async (req,res,next)=>{

    const features=new APIFeatures(Tour.findByIdAndDelete(req.params.id)); 
    // //EXECUTE QUERY
    const tours=await features.query;

    if(!tours){ // nếu không tồn tại ID hợp lệ trong database thì sẽ tạo ra lỗi
        return next(new AppError('No tour found with that ID',404)); // return để thoát ra
    }

    res.status(204).json({
        status:'success',
        data:null
    });

    // try{
    //     await Tour.findByIdAndDelete(req.params.id); //delere ko trả ra dữ liệu nên ko lưu vào biến
    //     res.status(204).json({
    //         status:'success',
    //         data:null
    //     });
    // }
    // catch(err){
    //     res.status(400).json({
    //         status:'fail',
    //         message:err
    //     })
    // }
});

//cách 2 của delete
// exports.deleteTour = factory.deleteOne(Tour)






exports.getTourStats=catchAsync(async (req,res,next)=>{
    const stats=await Tour.aggregate([ //Tour.aggregate trả ra 1 object Aggregate và cần await để trả ra kết quả (giống object Query)
        //Lọc các tài liệu: $match
        {
            $match:{ratingsAverage:{$gte:4.5}} // ratingsAverage >= 4.5
        },
        //tách tài liệu thành các nhóm: group
        {
            $group:{
                _id:{$toUpper:'$difficulty'},  // phân nhóm theo trường difficulty trong document, $toUpper: in hoa tên trường
                numTours:{$sum:1}, // mỗi mức độ có bao nhiêu tour 
                numRatings:{$sum:'$ratingsQuantity'},
                avgRating:{$avg :'$ratingsAverage'}, // tính trung bình cộng ratingsAverage các tour có ratingsAverage >= 4.5
                avgPrice:{$avg :'$price'},// tính trung bình cộng prive các tour có ratingsAverage >= 4.5
                minPrice:{$min:'$price'},// giá thấp nhất trong các tour có ratingsAverage >= 4.5
                maxPrice:{$max:'$price'},// giá cao nhất trong các tour có ratingsAverage >= 4.5
            }
        },
        //
        {
            $sort:{avgPrice: 1} // sort(sắp xếp) theo các trường khai báo trong group, 1 là sắp xếp từ thấp dến cao
        }

    ]);
    res.status(201).json({
        status:'success',
        data:{
            stats:stats
        }
    })
});


exports.getMonthlyPlan=catchAsync(async (req,res,next)=>{
    const year=Number(req.params.year); // 2021

    const plan=await Tour.aggregate([
        //$unwind được dùng để phân tách giá trị của một array field trong các input document. Nếu như array field của một input document có N phần tử thì trong output sẽ có N document.
        {
            $unwind:'$startDates', //startDates trong database là 1 mảng gồm 3 phần tử là các ngày khác nhau, thì khi qua unwind thì startDate chỉ hiện ra 1 ngày thỏa mãn điều kiện match
        },
        {
            $match:{ // điều kiện lọc là các tour có startDate thuộc khoảng [2021-01-01,2021-12-31]
                startDates:{
                    $gte:new Date(`${year}-01-01`),
                    $lte:new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group:{
                _id:{$month:'$startDates'}, // phân theo tháng của trường startDates <==> group by month
                numTourStarts:{$sum:1}, //  mỗi tháng có bao nhiêu tour có startDates thoải mỗi điều kiện match
                tours:{$push:'$name'} //$push: tạo mảng gồm các phần tử là tên các tour thỏa mãn điều kiện match,$name là thuộc tính name của tour
            }
        },
        {
            $addFields:{month:'$_id'} //  $addFields: thêm field có tên là month có giá trị là _id( _id ở đây là tháng được khai báo trên $group )
        },
        {
            $project:{_id:0}//0 là không hiển thị , 1 là hiển thị,  _id:0 --> không hiển thị id
        },
        {
            $sort:{
                numTourStarts:-1 // sort theo các trường khai báo trên group (_id,numTourStarts,...)
            }
        },
        {
            $limit:12 // giới hạn dữ liệu output
        }
    ]);
    res.status(201).json({
        status:'success',
        data:{
            plan:plan
        }
    })

});


// /tour-within/:distance/center/:latlng/unit/:unit
// /tour-within/233/center/16.070279, 108.196648/unit/mi
exports.getToursWithin = catchAsync(async (req,res,next) =>{
    const {distance,latlng,unit} = req.params
    const[lat,lng] = latlng.split(',');

    // nếu unit = mi (miles) thì bán kính trái đất bằng distance / 3963.2, nếu là km thì bán kính bằng distance / 6378.1
    const radius = unit === 'mi'? distance / 3963.2 : distance / 6378.1


    if(!lat || !lng){ // nếu không có kinh độ, vĩ độ thì tạo ra lỗi
        next(new AppError('Please provide latitutr and longtitude in format lat,lng'))
    };

    //longitude: kinh độ, latitude: vĩ độ
    const tours= await Tour.find({ // $geoWithin: find documents within a certain geometry, $geoWithin là geospatial operator 
        startLocation : { $geoWithin: { $centerSphere: [[lng,lat], radius] } } // tìm các tour nằm trong vị trí hình tròn có bản kính(radius) cho trước
    });
    console.log(distance,latlng,unit);
    res.status(200).json({
        status:'success',
        result:tours.length,
        data: {
            data:tours
        }
    });
});


exports.getDistances = catchAsync(async (req,res,next)=>{
    const {latlng,unit} = req.params
    const[lat,lng] = latlng.split(',');

    //nếu unit là mi(miles) thì multiplier = 0.000621371 không thì sẽ là 0.001(km)
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001//  1 met = 000621371 miles

    if(!lat || !lng){ // nếu không có kinh độ, vĩ độ thì tạo ra lỗi
        next(new AppError('Please provide latitutr and longtitude in format lat,lng'))
    };

    const distances = await Tour.aggregate([
        //for geospatial aggregation, there only 1 single stage and that's called geoNear,  $geoNear needs to be the first stage
        //geoNear requires that at least one of our field contains a geospatial index, đã có bên tourModel: tourSchema.index({startLocation: '2dsphere'});
        //first stage
        {
            $geoNear:{
                // near is the point from which to calculate the distances, so all the distances will be calculated between this point that we difined here, and then all the startLocations
                //near chính là [lat,lng] truyền vào
                near: {
                    type:'Point',
                    coordinates:[lng * 1, lat * 1] //lat * 1: convert sang number
                },
                distanceField:'distance', // name of the field that will be created and where all the calculated distances will be stored
                distanceMultiplier: multiplier //vì distance đang có đơn vị là met nên chuyển sang miles or km,  distanceMultiplier = distance/multiplier
            }
        },
        //second stage
        {
            $project:{
                distance : 1, //distance : 1 là field muốn giữ lại, 
                name : 1 // name : 1 là field muốn giữ lại
            }
        }
    ]);

    res.status(200).json({
        status:'success',
        data: {
            data:distances
        }
    });
});