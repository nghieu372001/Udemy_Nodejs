const express=require('express');
const reviewController=require('../controller/reviewController');//cách 1 -- import vào để sử dụng cách hàm trong các method của http: get,patch,delete,..
const authController=require('../controller/authController'); //import file authController.js từ thư mục controller

const router=express.Router({mergeParams:true}); //router là 1 function middleware, {mergeParams:true}: để khi reviewRoute được khai báo trong các route khác(vd:tourRoute) thì khác route của reviewRoute sử dụng chung params của các routes khác


router.use(authController.protect); // sau khi đăng nhập mới vào được các route dưới

router.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'),reviewController.setTourUserIds,reviewController.createReview) // trong get truyền vào 1 callback

router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user','admin'),reviewController.updateReview) // chỉ có user và admin mới có quyền sửa review
.delete(authController.restrictTo('user','admin'),reviewController.deleteReview)// chỉ có user và admin mới có quyền xóa review







module.exports=router;
