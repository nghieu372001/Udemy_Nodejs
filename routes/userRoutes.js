const express=require('express');
const userController=require('../controller/userController') // import hàm từ thư mục controller/userController
const authController=require('../controller/authController'); //import file authController.js từ thư mục controller


const router=express.Router(); //router là 1 function
// router.param('id',(req,res,next,val)=>{ // lấy ra param trên url(ví dụ:127.0.0.1:3000/api/v1/tours/4 --> param là 4)
//     console.log(`User id:${val}`);
//     next();
//  })
router.post('/signup',authController.signup) // chức năng sign up --> method: POST
router.post('/login',authController.login) // chức năng đăng nhập, gửi các thông tin đăng nhập --> method: POST
router.get('/logout',authController.logout) // chức năng log out
router.post('/forgotPassword',authController.forgotPassword) // gửi các thông tin đăng nhập --> method: POST
router.patch('/resetPassword/:token',authController.resetPassword) // gửi các thông tin đăng nhập --> method: POST


//Protect all routes after this midleware
router.use(authController.protect); // sau dòng code này thì mọi route bên dưới đều không cần phải có authController.protect
//bởi vì code chạy từ trên xuống dưới, khi qua dòng router.use(authController.protect); thì đã được xác minh là đã đăng nhập chưa, nếu login rồi thì chạy các route tiếp theo, nếu chưa thì báo lỗi

router.patch('/updateMyPassword',authController.updatePassword )

router.get('/me',userController.getMe,userController.getUser) //lấy thông tin user mà không có parameter trên url
router.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe) 
router.delete('/deleteMe',userController.deleteMe)



//sau dòng code router.use(authController.restrictTo('admin')); mọi route bên dưới không những có middleware protect mà còn có middleware restrictTo
router.use(authController.restrictTo('admin')); // sau dòng code này thì mọi route bên dưới chỉ có role=admin mới truy cập được

router.route('/') //.route('/') là định nghĩa route chung
      .get(userController.getAllUsers)// chạy hàm protect trong file authController.js xong rồi chạy tiếp hàm getAllUsers trong file userController nếu hàm trước đó không gặp lỗi
      .post(userController.createUser)

router.route('/:id')
      .get(userController.getUser)
      .patch(userController.updateUser)
      .delete(userController.deleteUser)

module.exports=router;