const express=require('express');
const tourController=require('../controller/tourController');//cách 1 -- import vào để sử dụng cách hàm trong các method của http: get,patch,delete,..
// const {getAllTours,createTour,getTour,updateTour,deleteTour}=require('../controller/tourController');  cách 2 dùng trực tiếp function
//vì bên file tourContronller export tất cả function nên tourController chứa đựng tất cả các function đó nên ghi tourController.getAllTours để trỏ đến function
const authController=require('../controller/authController'); //import file authController.js từ thư mục controller
const reviewRouter=require('./reviewRoutes'); //import file authController.js từ thư mục controller

const router=express.Router(); //router là 1 function


// router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'),reviewController.createReview) tương tự router.use('/:tourId/reviews',reviewRouter)

//trong route tour mà gặp url có dạng :app/vi/tour/:tourId/reviews thì sẽ vào reviewRoutes để tìm route tương ứng
// khi gặp url có dạng app/v1/:tourId/reviews thì sẽ chuyển qua reviewRoute để tìm route tương ứng, http method(GET, POST) được sử dụng trong url(app/v1/:tourId/reviews) sẽ quyết định sẽ lọt vào route nào trong reviewRoute 
router.use('/:tourId/reviews',reviewRouter)

//router.param('id',tourController.checking);  // khi gặp route có tham số là id thì nó sẽ chạy hàm checking sau đó mới thực hiện .get(tourController.getTour)


router.route('/')
.get(tourController.getAllTours) // trong get truyền vào 1 callback
// .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createTour) // source chuẩn
.post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.uploadTourImage,tourController.resizeTourImages,tourController.createTour) //tự làm 

router.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours) //thực hiện tourController.aliasTopTours rồi mới đến tourController.getAllTours(thứ tự thực hiện tùy vào ví trị), 
//có next() trong middlewaretourController.aliasTopTours để khi thực hiện xong thì tiếp tục thực hiện middleware tourController.getAllTours

router.route('/tour-stars').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(authController.protect,authController.restrictTo('admin','lead-guide','guide'),tourController.getMonthlyPlan);

//tìm các tour nằm trong 1 hình tròn có bán kính cho trước
router.route('/tour-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin) //:latlng kinh đô, vĩ độ

//tính khoảng cách từ điểm trung tâm hình tròn có bán kính cho trước đến các điểm tour
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances) //:latlng kinh đô, vĩ độ


router.route('/:id')
      .get(tourController.getTour)
      .patch(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.uploadTourImage,tourController.resizeTourImages,tourController.updateTour)
      .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour) //authController.restrictTo('admin','lead-guide') // admin, lead-guide mới có quyền xóa tour

module.exports=router;


