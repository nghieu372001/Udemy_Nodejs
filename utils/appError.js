class AppError extends Error{ // class AppError(được tạo) kế thừa từ lớp Error, sử dụng class AppError cho các lỗi operational error(lỗi hoạt động: lỗi thuộc về người dùng)
    constructor(message, statusCode){
        super(message); // super để gọi parent constructor, truyền vào message thì đó đối số mà hàm built-in error chấp nhận(giải thích cá nhân: lấy thuộc tính message trong lớp cha sao đó gán giá trị message truyền vào) 

        this.statusCode=statusCode;
        this.status=`${statusCode}`.startsWith('4')?'fail':'error'; //startsWith: hàm lấy ký tự đầu tiên - chỉ hoạt động với string
        this.isOperational=true;

        Error.captureStackTrace(this,this.constructor);// không quan trọng, this: current Object, this.contrustor: AppError Class itself
    }
}

module.exports=AppError;

