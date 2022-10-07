const express=require('express');
const bookingController=require('../controller/bookingController');//cách 1 -- import vào để sử dụng cách hàm trong các method của http: get,patch,delete,..
const authController=require('../controller/authController'); //import file authController.js từ thư mục controller

const router=express.Router(); //router là 1 function middleware, {mergeParams:true}: để khi reviewRoute được khai báo trong các route khác(vd:tourRoute) thì khác route của reviewRoute sử dụng chung params của các routes khác

router.use(authController.protect)
router.get('/checkout-session/:tourID',bookingController.getCheckOutSession)

router.use(authController.restrictTo('admin','lead-guide'))
router.route('/')
.get(bookingController.getAllBooking)
.post(bookingController.createBooking)

router.route('/:id')
.get(bookingController.getBooking)
.patch(bookingController.updateBooking)
.delete(bookingController.deleteBooking)



module.exports=router;
