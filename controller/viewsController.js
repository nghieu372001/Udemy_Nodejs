const Tour = require('../models/tourModel');
const catchAsync=require('../utils/catchAsync');
const AppError=require('../utils/appError');
const User = require('../models/userModel');


exports.getOverview =catchAsync(async (req,res,next) => {
    //1 Get tour dara from collection tours
    const tours =await Tour.find();
    //console.log(tours); là 1 mảng chứa gồm phần tử là object chứa thông tin của tour
    //2 Build template
    //3 Render that template using tour data from 1
    res.status(200).render('overview',{
      title: 'All Tours',
      tours:tours // gửi dữ liệu về overview.pug
    });
});

exports.getTour = catchAsync(async (req,res,next)=>{
  //1) get data, for the requested tour (including reviews and guides)
  let tour = await Tour.findOne({slug:req.params.slug}).populate({
    path:'reviews', // reviews là field ảo được tạo ra từ vituarl populate
    fields:'review rating user' // lấy các field cần
  });

  if(!tour){
    return next(new AppError('There are no tour with that name',404))
  }

  //2) Build template
  //3) Render template using data from 1
  res.status(200).render('tour',{
    title:tour.name,
    tour:tour
  });
});

exports.getLoginForm = (req,res)=>{
  // console.log(res.cookies);
  res.status(200).render('login',{
    title:'Login into your account'
  })
};


exports.getSignupForm = (req,res)=>{ //tự làm
  // console.log(res.cookies);
  res.status(200).render('signup',{
    title:'Sign up your account'
  })
}


exports.getCreateTourForm = (req,res)=>{ //tự làm
  // console.log(res.cookies);
  res.status(200).render('create-tour',{
    title:'Create Tour'
  })
}


exports.getAccount = (req,res) =>{
  res.status(200).render('account',{
    title:'Your Account'
  })
}

exports.updateUserData = catchAsync(async (req,res,next) =>{
  const updateUser = await User.findByIdAndUpdate(req.user.id,{
    // chỉ cho cập nhật name và email
    name:req.body.name,
    email:req.body.email
  },{
    new:true,
    runValidators:true
  });
  res.status(200).render('account',{
    title:'Your Account',
    user: updateUser
  });
});


