const express=require('express');
const viewsController = require('../controller/viewsController');
const authController=require('../controller/authController'); //import file authController.js từ thư mục controller

const router=express.Router();


router.get('/',authController.isLoggedIn,viewsController.getOverview);  // sử dụng middleware authController.isLoggedIn để xác minh đã đăng nhập chưa để có thể hiển thị header
router.get('/tour/:slug',authController.isLoggedIn,viewsController.getTour);
router.get('/login',authController.isLoggedIn,viewsController.getLoginForm);
router.get('/signup', viewsController.getSignupForm); // tự làm 
router.get('/me',authController.protect,viewsController.getAccount);

router.get('/create-tour',authController.protect,authController.restrictTo('admin'),viewsController.getCreateTourForm);// tự làm 


router.post('/submit-user-data',authController.protect, viewsController.updateUserData)


module.exports=router;