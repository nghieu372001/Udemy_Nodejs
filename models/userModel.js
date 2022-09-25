const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs')
const crypto=require('crypto')// module có sẵn trong nodejs, module dùng để mã hóa nội dung


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please tell us your name!']
    },
    email:{
        type:String,
        required:[true,'Please provide your email!'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'Please provide a valid email'] //validator.isEmail: kiểm tra có phải là email không, nếu không thì log chuỗi 'Please provide a valid email'
    },
    photo: {// tên ảnh ví dụ: user-3.jpg
        type:String,
        default:'default.jpg'

    },
    role:{
        type:String,
        emun:['user','guide','lead-guide','admin'], //emun chỉ nhận 1 trong số giá trị trong mảng
        default:'user'
    },
    password:{
        type:String,
        required:[true,'Provide a password'],
        minlength:8,
        select:false // không hiển thị khi lấy,đọc dữ liệu từ database, nghĩa là khi truy vấn (find,findBy,...) sẽ trả ra dữ liệu không bao gồm trường password mặc dù vẫn có trong database
    },
    passwordConfirm:{
        type:String,
        required:[true,'Please confirm your password'],
        validate:{
            //This only works on CREATE and SAVE!!!
            validator:function(el){ // hàm sẽ được gọi khi documnent đã được tạo, hàm validator sẽ return ra true hoặc false, el là giá trị của passwordConfirm được nhập vào
                return el === this.password //this trỏ về dữ liệu đang được thêm mới, return ra false khi el không bằng password và chạy xuông message
            },
            message:'Password are not the same!' //nếu passwordConfirm != password thì log ra message
        }
    },
    passwordChangedAt: Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type:Boolean,
        default:true,
        select:false // không hiển thị khi lấy,đọc dữ liệu từ database
    }
});

userSchema.pre('save',async function(next){// pre: chạy trước các sự kiện(hooks), sẽ lọt vào function middleware trước khi dữ liệu được lưu, next trong trường hợp gọi thêm 1 middleware nữa    
    if(!this.isModified('password')){//this trỏ về dữ liệu đang thao tác( ví dụ khi thêm mới user thì dữ liệu trước khi lưu vào database chính là dữ liệu đang thao tác)
        //.isModified: kiểm tra dữ liệu trường đó có thay đổi không
        return next(); //nếu không có sự thay đổi password thì return là thoát khỏi DOCUMENT MIDDLEWARE va gọi đến document middleware tiếp theo
    }
    //bcrypt.hash là 1 async function
    this.password=await bcrypt.hash(this.password,12) // password = password đã được mã hóa trước khi lưu vào database, 12 là level xử lý của CPU để xử lý, điểm càng cao CPU càng tốn thời gian để xử lý nên sử dụng async
    
    //delete password confirm field
    this.passwordConfirm=undefined;  // khi mã hóa xong thì không cần passwordConfirm nữa, chỉ cần lúc tạo mới, xóa trường passwordConfirm khi lưu dữ liệu

    next();
})


userSchema.pre('save',function(next){// hàm sẽ chạy trước khi documnent thực sự được lưu (bước 3 bên exports.resetPassword)
    if(!this.isModified('password') || this.isNew) return next(); // nếu không chỉnh sửa password hoặc document vừa được tạo mới thì chạy qua DOCUMENT MIDDLEWARE tiếp theo
    this.passwordChangedAt=Date.now() - 1000; // sau khi reset password thành công thì sẽ có trường passwordChangedAt, trừ 1 giây để đảm bảo rằng token được tạo ra sau khi password đã thay đổi

    next();
})



//userSchema.pre('find',..) là query middle query, sẽ được thực thi trước các method bắt đầu bằng find
userSchema.pre(/^find/, function(next){

    this.find({ active: {$ne:false} }); // tìm các data có active không bằng false
    next();
})

//instanced method khả dụng các tất cả các document được tạo bỏi userSchema
/*trong mongodb, các document nằm trong các collections, 1 {...} trong mongodb là 1 document.
Các document có nhiều phương thức được xây dựng sẵn trong chúng. Ngoài ra, bạn có thể thêm các phương thức cho các document.
*/
userSchema.methods.correctPassword=async function(candidatePassword,userPassword){//candidatePassword: password người dùng nhập vào, userPassword: password trong database
    //bcrypt.compare là 1 async function
    return await bcrypt.compare(candidatePassword,userPassword); //built-in function bcrypt.compare: so sánh 2 password nếu đúng trả ra true, sai thì trả ra false
}

userSchema.methods.changedPasswordAfter= function(JWTTimestamp){//JWTTimestamp: token được tạo ra khi nào
    // console.log('Đây là THIS');
    // console.log(this);
    // console.log(this.passwordChangedAt);
    // Đây là THIS
    // {
    //   _id: new ObjectId("631f3d20431867ec8c004fc7"),
    //   name: 'user',
    //   email: 'user@gmail.com',
    //   role: 'user',
    //   __v: 0,
    //   passwordChangedAt: 2022-09-12T14:32:46.498Z   
    // }
    // 2022-09-12T14:32:46.498Z

    if(this.passwordChangedAt){ //this trỏ về dữ liệu đang thao tác
        const changedTimestamp=parseInt(this.passwordChangedAt.getTime()/1000,10); // chuyển this.passwordChangedAt sang dạng biểu diễn thời gian giống với JWTTimestamp
        //console.log(this.passwordChangedAt,JWTTimestamp); //-->2019-06-30T00:00:00.000Z 1659184358
        //console.log(changedTimestamp,JWTTimestamp); //-->1561852800 1659184358
        return JWTTimestamp < changedTimestamp // --> return ra true là user đổi password,  JWTTimestamp < changedTimestamp: thời gian tạo token nhỏ hơn thời gian thay đổi password ==> user thay đổi password
    }
    return false;//return mặc định là false có nghĩa là user không thay đổi password 
}

userSchema.methods.createPasswordResetToken=function(){
    // chuỗi hex là 1 chuỗi gồm 0->9, A đến F (chữ hoa và chữ thường như nhau).
    const resetToken=crypto.randomBytes(32).toString('hex');//đoạn này tạo ra 1 mã ngẫu nhiên, randomBytes(32): 32 byte, toString('hex'): chuyển đổi thành chuỗi hex
    //console.log(resetToken); //cfff3a70fd2b11d23bc4a79207cd5f3a7d7b63456ddec66b5484a976bf68e1c2
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');//bước này chỉ là điều chỉnh dữ liệu => chưa có update dữ liệu, chưa có lưu. Nên bên authController.forgotPassword có 1 đoạn code await user.save({validateBeforeSave:false}); để lưu lại trong database,.update(resetToken) chuỗi muốn hash
    //console.log(this.passwordResetToken);// --> 8c6dc8f73a0dbb71d4a5542d61e643807d2e849e47789256ed8699c430e03a98
    this.passwordResetExpires=Date.now() + 10*60*1000; //bước này chỉ là điều chỉnh dữ liệu => chưa có update dữ liệu, chưa có lưu. Nên bên authController.forgotPassword có 1 đoạn code await user.save({validateBeforeSave:false}); để lưu lại trong database
    //this.passwordResetExpires thời gian mà mà được tạo ra ngẫu nhiêu (resetToken: tượng trưng cho token) kết thúc
    //10*60*1000 tương đương 10 phút
    return resetToken // return ra bản rõ của đoạn mã mới tượng trưng cho token
}

const User=mongoose.model('User',userSchema) // //tự động tạo User collection nếu chưa có, 'User' tên không được có chữ s sau cùng

module.exports=User