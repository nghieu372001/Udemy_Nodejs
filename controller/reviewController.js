const Review=require('../models/reviewModel'); // import model tour từ folder model
const catchAsync=require('../utils/catchAsync');
const AppError=require('../utils/appError');
const factory=require('./handlerFactory')


//cách 1: getAllReviews 
// exports.getAllReviews=catchAsync(async(req,res,next)=>{
//     let filter = {};
//     if(req.params.tourId) {
//         filter = {tour:req.params.tourId} // tìm tour có id này trong collection Review
//     }

//     const reviews = await Review.find(filter); // nếu
//     //console.log(reviews); trả ra 1 mảng gồm các phần từ là object chứa thông tin review

//     res.status(200).json({
//         status:"success1",
//         result:reviews.length,
//         data:{
//             reviews:reviews
//         }
//     })
// });


//cách 1 create review, nếu là cách 1 thì bên reviewRoute không cần reviewController.setTourUserIds ==> .post(authController.protect,authController.restrictTo('user'),reviewController.createReview) // trong get truyền vào 1 callback
// exports.createReview=catchAsync(async(req,res,next)=>{
//     //Allow nested routes
//     if(!req.body.tour){ 
//         req.body.tour = req.params.tourId; // .tourId vì router.route('/:tourId/reviews').post... bên tourRoutes
//     }

//     if(!req.body.user){
//         req.body.user = req.user.id //req.body.user được lấy từ middleware protect
//     }

//     const newReview = await Review.create(req.body);

//     res.status(200).json({
//         status:"success",
//         data:{
//             review:newReview
//         }
//     })
// });

//cách 2 create review
exports.setTourUserIds = (req,res,next) =>{ // middleware được dùng cho route  .post(authController.protect,authController.restrictTo('user'),reviewController.setTourUserIds,reviewController.createReview) // trong get truyền vào 1 callback
    if(!req.body.tour){ // nếu trong req.body không có key-value tour thì sẽ lọt vào if  
        req.body.tour = req.params.tourId; // .tourId vì router.route('/:tourId/reviews').post... bên tourRoutes
    }

    if(!req.body.user){ //nếu trong req.body không có key-value user thì sẽ lọt vào if
        req.body.user = req.user.id //req.user.id được lấy từ middleware protect
    }
    next()
};


exports.getAllReviews = factory.getAll(Review); //cách 2 getAllReview
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review); //cách 2 createReview
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review); // truyền model Review 

