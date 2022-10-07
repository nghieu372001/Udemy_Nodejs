const express=require('express'); // express là function
const morgan=require('morgan');// morgan là một middleware
const dotenv=require('dotenv');
const rateLimit = require('express-rate-limit'); // giới hạn request lên server
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');


const AppError=require('./utils/appError');
const globalErrorHandle=require('./controller/errorController');

const app=express();

dotenv.config({path:'./config.env'});// khai báo đường dẫn của config.env để sử dụng những biến được khai trong đó


//TEMPLATE ENGINE
//khai báo view engine để sử dụng pug
app.set('view engine','pug');
//khai báo template views nằm ở thư mục nào
app.set('views',path.join(__dirname,'views'));



//1- Middleware
/*
app.use mà không có đường dẫn cụ thể thì hàm sẽ được thực hiện mỗi lần request.
app.use có đường dẫn thì hàm  sẽ được thực hiện mỗi khi request đến đường dẫn
ví dụ:
app.use('/user/:id', function (req, res, next) {
  console.log('Request Type:', req.method)
  next()
})
hoặc
app.use('/user/:id', function (req, res, next) {
  console.log('Request URL:', req.originalUrl)
  next()
}, function (req, res, next) {
  console.log('Request Type:', req.method)
  next()
})
*/

if(process.env.NODE_ENV === 'development'){
  app.use(morgan('dev'));
}
//console.log(process.env.NODE_ENV);

// GLOBAL MIDDLEWARE -- phải để trước các route


// app.use(helmet()); //set security HTTP headers  // sử dụng sẽ cho ko sử dụng script axios trong base.pug // không được bật 


// app.use((req, res, next) => {
//   res.append('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
//   res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.append('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
  next();
})



const limiter = rateLimit({ // giới hạn request lên server, limiter là function
  max:100,
  windowMs:60 * 60 * 1000, // tương đương 1 giờ
  // allow 100 request  from the same IP in one house
  message :'Too many requests from this IP, please try again in an hour', // khi vượt quá giới hạn thì log ra message
});
app.use('/api', limiter);


//
//Body parser, reading data from into req.body
app.use(express.json()); //app.use là để sử dụng midleware, express.json() có tác dụng đưa dữ liệu được request(trong phần body của request chứa yêu cầu được client nhập vào ô) từ client vào object request bởi vì express không hỗ trợ điều này
app.use(express.urlencoded({extended:true}));  // midleware xử lý dữ liệu được gửi từ form. khi submit từ  form dữ liệu không thể truy cập bằng req.body nên cần sử dụng cái này
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // loại bỏ trong object req cái dấu $ nhằm tránh NoSQL query injection

//Data sanitization against xss
app.use(xss()); // ngăn các code html chứa code javascript độc hại từ người dùng nhập vào

//Prevent parameter pollution, ngăn ngừa các parameter bị lặp trong GET --> lấy cái cuối
app.use(hpp({
  whitelist:['duration','ratingsQuantity','ratingsAverage','maxGroupSize', 'difficulty','price'] //whitelist is simple an  array of properties for which allow duplicates in the query string
  //parameter duration cho phép được lặp
}));


//Tìm hiểu công dụng
app.use(compression());
app.use(cors());

//Serving static files
app.use(express.static(path.join(__dirname,'public'))) // middleware hiển thị html,img.css, khi là file tĩnh thì nó sẽ trỏ vào thư mục public
//__dirname: trỏ đến thư mục chứa file đang chạy đoạn code có chứa __dirname 
//console.log(path.join(__dirname,'public')); --> D:\NodeJS-Udemy\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours\starter\public

// app.use((req,res,next)=>{
//     console.log('Hello from the middleware!!!');
//     next();
// })


//Test midleware
app.use((req,res,next)=>{
    req.requesTime=new Date().toISOString(); // thêm thành phần vào trong object req được request lên từ client, thêm thuộc tính requestime vào object req, toISOString có dạng: 2017-06-15T07:41:18.475Z
    next();
})

//2 ROUTES
//Views
const viewRouter=require('./routes/viewRoutes')
app.use('/',viewRouter)

//Tour
const tourRouter=require('./routes/tourRoutes')
app.use('/api/v1/tours',tourRouter)
//Hướng đi: khi req,res được gửi lên server có đường dẫn(/api/v1/tours) là  nó sẽ lọt vào middleware tourRoute--> gọi đến tourRoute(routes) --> tourController(controller) để xử lý và respone lại cho client

//User
const userRouter=require('./routes/userRoutes')
app.use('/api/v1/users',userRouter)

//Review
const reviewRouter=require('./routes/reviewRoutes')
app.use('/api/v1/reviews',reviewRouter)

//Booking
const bookingRouter=require('./routes/bookingRoutes')
app.use('/api/v1/bookings',bookingRouter)




// Xử lý các url chưa được định nghĩa, để ở cuối cùng code
app.all('*',(req,res,next)=>{// thay vì phải viết code xử cho từng phương thức http như get, post, delete thì viết app.all là xử lý cho tất cả các phương thức http, '*' xử lý cho tất cả đường dẫn
    // const err= new Error(`Can't find ${req.originalUrl} on this server!`); // new Error tạo ra 1 lỗi và new Error tạo ra 1 object sau đó lưu vào biến err
    // err.statusCode=404;
    // err.status='fail';
    /*console.log(err); --> err là 1 object
      {
        statusCode: 404,
        status: 'fail'
      }
    */
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // khi truyền đối số vào hàm next, dù là gì đi nữa thì Express luôn rằng đó là lỗi, sau đó nó sẽ bỏ qua tất cả các middleware khác trong middleware stack và gửi lỗi mà chúng ta truyền vào tới Global error handling middleware
    // đường đi: lỗi được tạo ra bởi class AppError sau đó đến Global error handling middleware để response lại cho client
  });


// Global Error Handling Middleware
app.use(globalErrorHandle)




// app.get('/',(req,res)=>{
//   res.sendFile(`${__dirname}/public/overview.html`)
// })

//3 server
module.exports=app;