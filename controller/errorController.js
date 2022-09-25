const AppError=require('../utils/appError')

const handleCastErrorDB=(err)=>{
    const message=`Invalid ${err.path}: is ${err.value}.`
    return new AppError(message,400)
}

const handleDuplicateFieldDB=(err)=>{
    const message=`Duplicate field value: ${err.keyValue.name}. Please use another name!`
    return new AppError(message,400)
}

const handleValidatorErrorDB=(err)=>{
    //console.log(Object.values(err.errors)); trong object err có một object errors chứa message( ví dụ: A tour name must have more or equal then 10 characters)
    /*Object.values()
        const object1 = {
        a: 1,
        b: 2,
        c: 3
        };

        console.log(Object.values(object1));
        // output: Array [1, 2, 3]
    */
    const errors=Object.values(err.errors).map(el => el.message)
    const message=`Invalid input data. ${errors.join(', ')}`;
    return new AppError(message,400)
}
/* 
Ví dụ về lỗi ID hợp lệ
Lỗi mà class AppError trả ra khi Get Tour By Id có 1 id hợp lệ nhưng không tồn tại trong database
console.log(err)

AppError: No tour found with that ID
    at D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\controller\tourController.js:160:21
    at processTicksAndRejections (node:internal/process/task_queues:96:5) {
  statusCode: 404,
  status: 'fail',
  isOperational: true
}

Ví dụ về lỗi ID không hợp lệ
console.log(err); // err.name =CastError, trong object err có thuộc tính name nhưng log ra lại ko hiện
CastError: Cast to ObjectId failed for value "wxxxxxxxxx" (type string) at path "_id" for model "Tour"
    at model.Query.exec (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\query.js:4780:21)       
    at model.Query.Query.then (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\query.js:4879:15) 
{
  messageFormat: undefined,
  stringValue: '"wxxxxxxxxx"',
  kind: 'ObjectId',
  value: 'wxxxxxxxxx', // giá trị của trường nhập sai format
  path: '_id', // path là tên trường nhập sai format
  reason: BSONTypeError: Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer
      at new BSONTypeError (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\bson\lib\error.js:41:28)
      at new ObjectId (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\bson\lib\objectid.js:67:23)
      at castObjectId (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\cast\objectid.js:25:12)   
      at ObjectId.cast (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\schema\objectid.js:246:12)
      at ObjectId.SchemaType.applySetters (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\schematype.js:1188:12)
      at ObjectId.SchemaType._castForQuery (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\schematype.js:1622:15)
      at ObjectId.SchemaType.castForQuery (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\schematype.js:1612:15)
      at ObjectId.SchemaType.castForQueryWrapper (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\schematype.js:1589:20)
      at cast (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\cast.js:344:32)
      at model.Query.Query.cast (D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\node_modules\mongoose\lib\query.js:5202:12),
  valueType: 'string'
}

*/
const handleJWTError =()=>{
    const message=`Invalid token. Please log in again!`;
    return new AppError(message,401)
}

const handleJWTExpiredError =()=>{
    const message=`Your token has expired! Please login again`;
    return new AppError(message,401)
}




const sendErrorDev=(err,req,res)=>{
    //API 
    if(req.originalUrl.startsWith('/api')){
        console.log(req.originalUrl);
        res.status(err.statusCode).json({
            status:err.status,
            error:err,
            message: err.message,
            stack:err.stack
        });
    }
    //RENDER WEBSITE
    else{
        res.status(err.statusCode).render('error',{
            title: 'Something went wrong!',
            msg:err.message
        });
    }
}

const sendErrorProd=(err,req,res)=>{
    //A API
    if(req.originalUrl.startsWith('/api'))
    {
        //Operational, trusted error: send message to client
        if(err.isOperational){
            res.status(err.statusCode).json({
                status:err.status,
                message: err.message
            })
        }
        //Programing or other unknow error: don't leak  error details
        else{
            //1 log error
            console.error('ERROR: ',err);
            //2 send generic message
            res.status(500).json({
                status:'error',
                message:'Something went very wrong'
            })
        }
    }

    //B RENDER WEBSITE
    else
    {
        if(err.isOperational){
            res.status(err.statusCode).render('error',{
                title: 'Something went wrong!',
                msg:err.message
            });
        }
        //Programing or other unknow error: don't leak  error details
        else{
            //1 log error
            console.error('ERROR: ',err);
            //2 send generic message
            res.status(err.statusCode).render('error',{
                title: 'Something went wrong!',
                msg:'Please try again later'
            });
        }
    }
}


module.exports=(err,req,res,next)=>{ // định nghĩa 4 tham số err,req,res,next thì Express sẽ tự động hiểu là error handling middleware, 3 tham số (err,req,res) là object, err sẽ nhận lỗi thì next(new AppError)
    err.statusCode=err.statusCode || 500;
    err.status=err.status || 'error';

    //console.log('Đây là error');
    //console.log(err);
    // Đây là error
    // AppError: The user belonging to this token does no longer exist.
    //     at D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\controller\authController.js:107:21
    //     at processTicksAndRejections (node:internal/process/task_queues:96:5) {
    //   statusCode: 401,
    //   status: 'fail',
    //   isOperational: true
    // }

    if(process.env.NODE_ENV === 'development'){
        //console.log(err);
        sendErrorDev(err,req,res);
    }
    else if(process.env.NODE_ENV === 'production'){
        let error={...err}; // khi làm như này thì không thể lấy được message trong npm run start:prod nên phải có error.message = err.message;
        error.message = err.message;

        if(error.name === "CastError"){ //CastError: lỗi ID không hợp lệ
            error=handleCastErrorDB(error);
        }
        if(error.code === 11000){
            error=handleDuplicateFieldDB(error);
        }
        if(error.name ==='ValidationError'){
            error=handleValidatorErrorDB(error);
        }
        if(error.name ==='JsonWebTokenError'){
            error=handleJWTError();
        }
        if(error.name ==='TokenExpiredError'){
            error=handleJWTExpiredError();
        }

        sendErrorProd(error,req,res);
    }
  }