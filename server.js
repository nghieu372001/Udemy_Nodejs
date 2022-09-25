const mongoose=require('mongoose');
const dotenv=require('dotenv');

//xử lý lỗi uncaughtException
process.on('uncaughtException',err=>{
    console.log('UNCAUGHT. SHUTTING DOWN...');
    console.log(err.name, err.message);
    process.exit(1);
})


const app=require('./app');

dotenv.config({path:'./config.env'}); // khai báo đường dẫn của config.env để sử dụng những biến được khai trong đó

const port=process.env.port || 8000;
const DB=process.env.DATABASE;


//tạo kết nối đến database(mongoDB)
mongoose.connect(DB,{ //mongoose.connect trả ra return
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(connect =>{
    console.log('DB connection successful!');
})

app.listen(port,()=>{
    console.log(`App running on ${port}`);
});

//Xử lý lỗi promise unhandle rejection (ví dụ như sai mật khẩu DB);
process.on('unhandledRejection',err=>{
    console.log('UNHANDLED REJECTION. SHUTTING DOWN...')
    console.log(err.name, err.message);
    server.close(()=>{  
        process.exit(1);
    })
})


