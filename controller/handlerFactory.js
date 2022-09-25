const catchAsync=require('../utils/catchAsync');
const AppError=require('../utils/appError');
const APIFeatures=require('../utils/apiFeatures');


exports.deleteOne = Model => catchAsync(async (req,res,next)=>{ // Model là các Tour, User, Review được dùng trong các functuon như User.find(), Tour.create()
    const doc = await Model.findByIdAndDelete(req.params.id); //delere ko trả ra dữ liệu nên ko lưu vào biến

    if(!doc){ // nếu không tồn tại ID hợp lệ trong database thì sẽ tạo ra lỗi
        return next(new AppError('No document found with that ID',404)); // return để thoát ra
    }

    res.status(204).json({
        status:'success',
        data:null
    });
});


exports.updateOne = Model => catchAsync(async (req,res,next)=>{ // Model là các Tour, User, Review được dùng trong các functuon như User.find(), Tour.create()
    const doc=await Model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});
    if(!doc){ // nếu không tồn tại ID hợp lệ trong database thì sẽ tạo ra lỗi
        return next(new AppError('No document found with that ID',404)); // return để thoát ra
    }

    res.status(200).json({
        status:'success',
        data:{
            data:doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req,res,next)=>{ // Model là các Tour, User, Review được dùng trong các functuon như User.find(), Tour.create()
    const doc=await Model.create(req.body);
    res.status(200).json({
        status:'success',
        data:{
            data:doc
        }
    });
});


//lấy dữ liệu dựa vào id trên url
exports.getOne = (Model,popOptions) => catchAsync(async (req,res,next)=>{
    let query = Model.findById(req.params.id); // trả ra Query objec
    if(popOptions) query=query.populate(popOptions);  // trả ra Query objec
    const doc = await query;  // thực thi Query objec để trả ra dữ liệu

    if(!doc){ // nếu không tồn tại ID hợp lệ trong database thì kết quả tours trả về sẽ là null nên lọt vào if, nếu ID không hợp lệ sẽ lọt vào catch trong file catchAsync.js
        return next(new AppError('No document found with that ID',404)); // return để thoát ra
    }

    res.status(200).json({
        status:'success',
        data: {
            data:doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req,res,next)=>{
    //To allow for nested GET review on tour
    let filter = {};
    if(req.params.tourId) {
        filter = {tour:req.params.tourId} // tìm tour có id này trong collection Review
    }

    //EXECUTE QUERY
    //console.log(req.query); khi không có tham số (params) trên url thì req.query = {}, khi có tham số (params) trên url thì req.query = {name: 'The Snow Adventurer'}
    const features=new APIFeatures(Model.find(), req.query); // new APIFeatures(Tour.find(), req.query) sẽ trả ra 1 object APIFeatures, trong object APIFeatures có object Query được lưu vào biến query(query là biến được khai báo trong class APIFeatures và được nhận giá trị thông qua đối số được truyền vào)
    // có thể viết: const features=new APIFeatures(Tour, req.query) // new APIFeatures(Tour.find(), req.query) sẽ trả ra 1 object APIFeatures, trong object APIFeatures có object Query được lưu vào biến query(query là biến được khai báo trong class APIFeatures và được nhận giá trị thông qua đối số được truyền vào)
    features.filter().sort().limitFields().paginate(); // đoạn code này vẫn trả ra 1 object APIFeatures
    //const doc=await features.query.explain();
    const doc=await features.query; // features.query trả ra object Query, thực thi Query để trả ra dữ liệu

    res.status(200).json({
        status:'success',
        result: doc.length,
        data:{
            data:doc
        }
    });
});


