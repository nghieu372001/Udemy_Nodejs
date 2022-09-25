const catchAsync = fn => {// fn(req,res,next): truyền các tham số đầu vào cho hàm async, ở đây fn chính là hàm async được truyền qua đối số exports.createTour=catchAsync(async(req,res,next)...)
    return (req,res,next)=>{ // hàm được return sẽ được gọi khi new tour should be created using createTour handler
        fn(req,res,next).catch(err =>next(err)) // vì hàm async return ra promise nên có thể .catch, nếu có lỗi thì next(err) --> chạy đến Global Handling Middleware
    } 
}

module.exports=catchAsync;