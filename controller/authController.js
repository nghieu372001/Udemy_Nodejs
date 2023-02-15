const {promisify}=require('util'); // 1 module built-in trong node, có chứa built-in function: promisify
const crypto=require('crypto');
const User=require('../models/userModel');
const catchAsync=require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError=require('../utils/appError');
const Email=require('../utils/email');


const signToken = id=>{ // tạo token với tham số là id, jwt.sign tạo ra 1 token mới
    return jwt.sign({id},process.env.JWT_SECRET,{//tham số 1:payload(1 object gồm các data muốn lưu trong token),user._id trong mongodb là id, tham số 2 là chuỗi bất kì, tham số 3 là optinal(tùy chọn)
        expiresIn:process.env.JWT_EXPIRE_IN //token hết hạn sau 100 ngày, expiresIn đã được xây dựng sẵn
        // hàm này trả về 1 chuỗi string token
    })
}

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id) // biến token sẽ lưu token được tạo từ hàm signToken

    const cookieOptions = { // 1 object
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_IN * 24 * 60 * 60 * 1000), //expires: cookie sẽ được browser xóa sau khi hết hạn, *24*60*60*1000 chuyển thành miliisecond
        //secure:true, // the cookie will only be sent on a encrypted connection, sent when using https
        httpOnly: true // this will make it so that the cookie cannot be accsessed or modified in any way by the browser
    };

    if(process.env.NODE_ENV === 'production')  cookieOptions.secure = true// nếu là dạng 'production' thì thêm secure:true vào object cookieOptions
        
    res.cookie('jwt', token, cookieOptions); // tạo mới cookie
    user.password = undefined;

    res.status(statusCode).json({
        status:'success',
        token:token, // gửi token về cho client
        data:{
            user:user
        }
    });
}

exports.signup=catchAsync(async(req,res,next)=>{
    /*console.log(req.body);
    {
        email: 'user1@gmail.com',
        name: 'user1',
        password: 'password12345',
        passwordConfirm: 'password12345'
    }
    */
    const newUser=await User.create({//User.create(req.body) return là 1 promise là 1 Object query, thực thi Object query(await User.create(req.body)) sẽ trả ra 1 object chứa thông tin của user vừa mới tạo
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
        // khi tạo mới từ dữ liệu mà user nhập vào thì chỉ có các trường này khi lưu vào database, user ghi các trường khác các trường được quy định ở trên thì không được lưu vào database, các trường có giá trị default ở userModel.js sẽ được lưu tự động nếu mà không được nhập
    });
    
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser,url).sendWelcome() // await vì sendWelcome là async và return ra promise 

    createSendToken(newUser,201,res)
    //const token=signToken(newUser._id)

    // res.status(201).json({
    //     status:'success',
    //     token:token,
    //     data:{
    //         user:newUser
    //     }
    // });
});


exports.login=catchAsync(async (req,res,next)=>{
    // const email=req.body.email; === const {email}=req.body --> lấy thuộc tính email trong object req.body biến vào biến email nếu biến khởi tạo và thuộc tính trong object cùng tên
    // const password=req.body.password;

    //lấy thông tin email và passworn từ cliend gửi lên
    const {email,password}=req.body // bằng với cách trên --> { email: 'user@gmail.com', password: 'pass12345' }

    //1 Check if email and password exist
    if(!email || !password){ // khi gửi thông tin lên server nếu thiếu 1 trong 2 thì gửi lỗi
        return next(new AppError('Please provide email and password'), 400); // new AppError là tạo lỗi, next gọi đến global handling error để gửi lỗi cho client
    }

    //2 Check if user exists && password is correct
    const user=await User.findOne({email:email}).select('+password') // tìm dữ liệu có email giống với email được gửi lên, .select('+password') vì kết quả trả về không bao gồm trường password nên .select('+password') để thêm vào kết quả trả về trường password trong object query, không hiển thị trường password thì bên userModel trường password có thuộc tính select: false
    //user lưu kết quả trả về khi await thực thi xong là 1 object chứa các thông tin user trả về từ database --> user document
    
    //await user.correctPassword(password,user.password);//password: người dùng nhập vào, user.password: trong database, user.correctPassword là 1 async function

    if(!user || ! await user.correctPassword(password,user.password)){ // nếu không tìm thấy dữ liệu(document) trong database hay password nhập vào không giống với password trong database thì lọt vào if
        return next(new AppError('Incorrect email or password',400));
    }
    //3 If everythinh is ok, send token to client
    createSendToken(user,200,res)

    
    //const token=signToken(user._id);


    // res.status(200).json({ // gửi token về client, nếu không có bước này clinet sẽ không nhận được token
    //     status:'success',
    //     token:token
    // });
})


exports.logout = (req,res) => {
    res.cookie('jwt','loggedout',{
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly:true
    });
    res.status(200).json({
        status:'success'
    })
}

exports.protect=catchAsync(async(req,res,next)=>{
    // sau khi qua các bước có tạo token và gửi lại về phía client, thì khi client request lên server thì trong object request có chứa authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyZTYzMmY3MTYxNzg3OTEyOGI1MjYyZCIsImlhdCI6MTY1OTI3MDgzMiwiZXhwIjoxNjY3OTEwODMyfQ._B9sJjaZhFqpaNcOQiGfzHddIsHNSU93aIp4nNujQoQ',
    //1 Getting token and check of it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){ // khi client gửi request có chứa token về phía server thì phần headers của request là 1 object , trong object trong 1 cặp key-value đại diện cho token là authorization: 'Beaer (mã token)'
         token= req.headers.authorization.split(' ')[1];// req.header.authorization= 'Bearer vssfsfsdscscsc', .split(' ') chia chuỗi thành mảng gồm 2 phần tử ['Bearer','vssfsfsdscscsc'] , [1] lấy phần tử thứ 2 (ở đây là mã token)
    }
    else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }

    // 
    if(!token){ // không có token trong request từ client
        next(new AppError('You are not  logged in! Please log in to get access',401));
    }
    //2 Verification token (token có hợp lệ hay không), token hợp lệ là token được tạo ra từ payload gồm id của user
    const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET); //.verify là async funtion, promisify(jwt.verify)(token,process.env.JWT_SECRET) return promise -->Promise {{ id: '62e29d15a311f5e073a0fbb8', iat: 1659018518, exp: 1667658518 }}, await promisify(jwt.verify)(token,process.env.JWT_SECRET) sẽ trả ra object-->{ id: '62e29d15a311f5e073a0fbb8', iat: 1659018518, exp: 1667658518 } sau đó lưu vào biên decoded,promisify(jwt.verify) khiên cho hàm .verify return ra promise
    //console.log(decoded);  { id: '62e632f71617879128b5262d', iat: 1662909963, exp: 1671549963 }
    
    //3 Check if user still exist // kiểm tra xem user có tồn tại trong database nữa không
    const currentUser=await User.findById(decoded.id);  // tìm user trong database theo id (id của user đăng nhập nằm trong decoded)
    if(!currentUser){// khi không tìm thấy user thì tạo lỗi theo cú pháp của AppError , truyền qua tham số err của errorController
        return next(new AppError('The user belonging to this token does no longer exist.',401));
    }
    //4 Check if user change password aften the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){//decoded={ id: '62e29d15a311f5e073a0fbb8', iat: 1659018518, exp: 1667658518 },decoded.iat là thời gian khởi tạo token
        return next(new AppError('User recently changed password! Please login again'),401);
    } 

    //chuyển đến middleware tiếp thep trong route
    req.user=currentUser; // thêm thông tin của người request hiện tại vào obj req (được dùng cho restrictTo), giải thích thêm trong object req có key:user , value:currentUser  là 1 object chứa thông tin của người dùng
    res.locals.user = currentUser; //các object  nằm trong res.locals thì pug template sẽ truy cập được object đó
    /*console.log(req.user)
        {
        _id: new ObjectId("631f3d20431867ec8c004fc7"),
        name: 'user',
        email: 'user@gmail.com',
        role: 'user',
        __v: 0,
        passwordChangedAt: 2022-09-12T14:36:08.052Z
        }
    */
    next();
});


//Only for render pages, no errors!
exports.isLoggedIn=catchAsync(async(req,res,next)=>{
    //Our token should come from the cookies and not from an authorization header, because  for render page will not have the token in the header
    //For our entire render website the token will aways only be sent using the cookies

   if(req.cookies.jwt){ // khi có cookie trên web thì lọt vào
        try{
            //1 verify token 
            const decoded=await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET); //.verify là async funtion, promisify(jwt.verify)(token,process.env.JWT_SECRET) return promise -->Promise {{ id: '62e29d15a311f5e073a0fbb8', iat: 1659018518, exp: 1667658518 }}, await promisify(jwt.verify)(token,process.env.JWT_SECRET) sẽ trả ra object-->{ id: '62e29d15a311f5e073a0fbb8', iat: 1659018518, exp: 1667658518 } sau đó lưu vào biên decoded,promisify(jwt.verify) khiên cho hàm .verify return ra promise
            //console.log(decoded);  { id: '62e632f71617879128b5262d', iat: 1662909963, exp: 1671549963 }
            
            //2 Check if user still exist // kiểm tra xem user có tồn tại trong database nữa không
            const currentUser=await User.findById(decoded.id);  // tìm user trong database theo id (id của user đăng nhập nằm trong decoded)
            if(!currentUser){// khi không tìm thấy user thì tạo lỗi theo cú pháp của AppError , truyền qua tham số err của errorController
                return next(); // gọi middleware tiếp theo
            }
            //3 Check if user change password aften the token was issued
            if(currentUser.changedPasswordAfter(decoded.iat)){//decoded={ id: '62e29d15a311f5e073a0fbb8', iat: 1659018518, exp: 1667658518 },decoded.iat là thời gian khởi tạo token
                return next(); //gọi middleware tiếp theo
            }

            //There is a logged in user - token is verified, user still exists, user didn't change their password
            res.locals.user = currentUser // thêm vào res.locals 1 object có key: user, value là 1 object thông tin user đang đăng nhập
            // các object  nằm trong res.locals thì pug template sẽ truy cập được object đó, như ở đây là object user nằm ở res.locals nên trong _header.pug sẽ truy cập được nếu có
            return next(); // gọi middleware tiếp theo, phải có return ở đây vì nếu không có thì khi lọt vào if mà có cookie sẽ next() trong if và tiếp tục next() ngoài if gây ra lỗi
        }
        catch(err){
            return next();
        }
    }
    next() // không có cookie sẽ không lọt vào if thì sẽ đến middleware tiếp theo
});



exports.restrictTo=(...roles)=>{ //...role--> tạo ra 1 mảng chứa các tham số truyền vào ==>['admin','lead-guide']
    return (req,res,next) =>{
        if(!roles.includes(req.user.role)){ //nếu role = user sẽ chạy vào if
            return next(new AppError('You do not have permission to perform this action'),401);
        }
        next();
    };
};

exports.forgotPassword=catchAsync(async (req,res,next)=>{
    //1 Get user base on POSTed email
    const user=await User.findOne({email:req.body.email}); // tìm user dựa trên email được gửi lên
    if(!user){ // nếu không tìm thấy dữ liệu bằng email gửi lên thì lọt vào if
        return next(new AppError('There is no user with address email'),404);
    }
    
    //2 Generate the random reset token -- tạo ra token mới
    const resetToken=user.createPasswordResetToken();
    await user.save({validateBeforeSave:false}); //user.save({validateBeforeSave:false}); để lưu vào database(xem ghi chú bên userModel), validateBeforeSave loại bỏ các xác thực được chỉ định trong userModel như yêu cầu nhập email,password, confirmPassword

    //3 Send it to user email
    try{
        const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user,resetURL).passwordReset();
        res.status(200).json({
            status:'success',
            message:'Token sent to email!'
        });
    }
    catch(err){// nếu thực thi  await sendEmail gặp lỗi thì reset lại passwordResetToke và passwordResetExpires
        user.passwordResetToken=undefined; // chỉ là điều chỉnh, chưa có lưu
        user.passwordResetExpires=undefined;// chỉ là điều chỉnh, chưa có lưu
        await user.save({validateBeforeSave:false}); // lưu sự điều chỉnh
        return next(new AppError('There was a error sending the email. Try again later'),500);
    }
});

exports.resetPassword= catchAsync(async (req,res,next)=>{
    //1 Get user base on token
    const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex') // req.params.token vì router.patch('/resetPassword/:token',authController.resetPassword), .digest('hex') chuyển đổi sang hệ hex
    
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passResetExpires: {$gt: Date.now()} // tìm token reset chưa hết hạn  -->  lớn hơn Date.now() là còn hạn
    });

    console.log(user);

    //2 if token has not expired, and there is user, set new password
    if(!user){ // nếu ko tìm thấy user nào thỏa mãn điều kiện thì vào if
        return next(new AppError('Token is invalid or has expired',400))
    }

    user.password=req.body.password; // set password mới 
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined; // xóa trường passwordResetToken khi reset mật khẩu thành công
    user.passwordResetExpires=undefined;// xóa trường passwordResetExpires khi reset mật khẩu thành công
    //mới modify data (điều chỉnh dữ liệu) chưa có lưu nên dùng .save
    await user.save();

    //3 Update changedPasswordAt property for the user( bên userModel), chạy tự động trong các DOCUMENT MIDDLEWARE bên user model

    //4 Log the user in, send JWT to client
    createSendToken(user,200,res)
    
    // const token=signToken(user._id)

    // res.status(200).json({
    //     status:'success',
    //     token:token
    // })
});

exports.updatePassword=catchAsync(async(req,res,next)=>{ // dùng cho người dùng đã đăng nhập rồi
    //1 get user from collection
    const user=await User.findById(req.user.id).select('+password')

    //2 check if POSTed current password is correct
    // so sánh password được gửi lên từ client (req.body.passwordCurrent) với password trong database (user.password) có giống nhau không
    if(!(await user.correctPassword(req.body.passwordCurrent,user.password))) {//user.correctPassword là 1 async function nên dùng await
        return next(new AppError('Your current password is wrong.',401))
    }

    //3 If password is correct, update password
    user.password=req.body.password; // set password mới 
    user.passwordConfirm=req.body.passwordConfirm;
    await user.save();
    //chú ý: User.findByIdAndUpdate will not work as intended

    //4 Log user in, send JWT
    createSendToken(user,200,res)
})

