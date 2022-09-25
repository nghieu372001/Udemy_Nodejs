const mongoose=require('mongoose');
const slugify=require('slugify');
const validator=require('validator'); // import package validator để sử dụng cho trường name và các trường khác
// const User = require('../models/userModel');

// tạo lược đồ Schema để mô tả dữ liệu(giống hàm tạo-định nghĩa sẵn thuộc tính của các cột),trong mongoose.Schema có thể có nhiều hơn 2 object, object 1 là lược đồ dữ liệu, object 2 là tùy chọn 
const tourSchema=new mongoose.Schema({  
    name: {
        type:String,
        required:[true,'A tour must have a name'],//[true,'A tour must have a name'] : trường bắt buộc nhập, nếu ko nhập thì log ra lỗi A tour must have a name
        unique:true, // tên không được trùng nhau
        trim:true, //trim chỉ hoạt động với kiểu dữ liệu là String, trim giúp loại bỏ khoảng trống ở đầu và cuối
        maxlength:[40,'A tour name must have less or equal then 40 characters'], //tên tour phải có >=40 kí tự nếu không sẽ hiện ra lỗi
        minlength:[10,'A tour name must have more or equal then 10 characters'],
        //validate: [validator.isAlpha,'Tour name must only contain characters'] //validator.isAlpha chỉ chỉ định, không gọi hàm -->validator.isAlpha
    }, 
    slug:String,
    duration:{
        type:Number,
        required:[true,'A tour must have a duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true,'A tour must have a group size']
    },
    difficulty:{
        type:String,
        required:[true,'A tour must have a difficulty'],
        enum:{ // trường difficulty chỉ được nhận 3 giá trị này, nếu không sẽ hiện lỗi, emun có kiểu dữ liệu là String
            values:['easy','medium','difficult'],
            message:'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type:Number, 
        default:4.5,
        min:[1,'Rating must be above 1.0'], // min max có kiểu dữ liệu là number hoặc date
        max:[5,'Rating must be below 5.0'], //ratingsAverage có giá trị cao nhất là 5, giá trị thấp nhất là 1
        set: val => Math.round(val * 10)/10 // 4.66666 --> 4.7
    },
    ratingsQuantity:{
        type:Number, 
        default:0
    },
    price: {
        type:Number,
        required:[true,'A tour must have a price']
    },
    priceDiscount:{
        type:Number,// có thể ghi:priceDiscount:Number
        validate:{ // return ra false(có nghĩa là val > this.price) thì lọt vào message
            validator:function(val) { // validate: tự tạo hàm xác thực (validation) riêng,val là giá trị của priceDiscount được nhập vào
                return val < this.price //this trỏ về dữ liệu đang được thêm mới, this không hoạt động được với sửa, chỉ hoạt động với .create() or .save()
            },
            message:'Discount price ({VALUE}) should be below regular price' //VALUE=val, ({VALUE}) cú pháp mongoose
        }
    }, 
    summary:{
        type:String,
        trim:true,// trim chỉ hoạt động với kiểu dữ liệu là String, trim giúp loại bỏ khoảng trống ở đầu và cuối
        required:[true,'A tour must have a summary']
    }, 
    description:{
        type:String,
        trim:true
    },
    imageCover:{
        type:String,
        required:[true,'A tour must have a imageCover']
    },
    images:[String], // vì có nhiều hình ảnh nên phải lưu nó vào mảng --> [String]
    createAt:{
        type:Date,
        default:Date.now()
    },
    startDates:[Date], // nhập chuỗi ngày thì moongse tự động chuyển sang kiểu date,vì có nhiều ngày bắt đầu nên phải lưu nó vào mảng --> [String]
    secretTour:{
        type:Boolean,
        default:false
    },
    //name, duration, secretTour, images, ... là các field của tourSchema, trong các field định nghĩa các schema type options (type, required... )

    // để khai báo trường chứa dữ liệu không gian (geospatial data) trong mongodb, thì cần tạo ra 1 object(startLocation) và cần ít nhất 2 field type, coordinates như những gì đã khai báo
    // -- tắt để tạo tour thêm ảnh
    startLocation:{ // startLocation là 1 embedded object - modeling data nhưng bản chất vẫn là field của tourSchema
        // GeoJSON -- để object startLocation được hiểu là 1 geospatial JSON thì cần 2 thuộc tính type và coordinate
        type:{ // type là 1 subfield(field con)
            type:String,
            default:'Point',
            enum:['Point']
        },
        coordinates: [Number], // có kiểu là 1 mảng số, biểu diễn vĩ độ, tung độ
        address:String,
        description:String
        //khi nhấn vào trường startLocation của 1 document ở collection tour thì sẽ thấy các subfield là type, coordinates, address, description
    },
    locations :[ //location là 1 embedded object, tour này sẽ đi qua các địa điểm nào, nếu cái field để [ {...} ] thì field này sẽ là 1 mảng chứa cái subfield(field con)-object
        {
            type : {
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates: [Number], // có kiểu là 1 mảng số, biểu diễn vĩ độ, tung độ
            address:String,
            description:String,
            day: Number // the day of the tour in which people will go to the location
        }
        //khi nhấn vào trường location của 1 document ở collection tour thì sẽ thấy các object, khi nhấn vào object sẽ thấy các field : type, coordinates, address, description, day

    ],

    // // guides: Array: EMBEDDED USER INTO TOUR, -- không dùng
    guides:[ // tour sẽ có các id của tour guide
        {
            type: mongoose.Schema.ObjectId, // mỗi object sẽ có 1 id mongoID (vd: _id: "5c88fa8cf4afda39709c296f")
            ref: 'User' // tham chiếu đến USER, khi truy vấn (client) đến các route Tour thì trong JSON trả về thì field guides sẽ là 1 array gồm các object chứa thông tin của user, còn user nào sẽ xuất hiện dựa vào object trong field guides được thêm vào bên mongodb
        }
    ]
},{
    //dùng cho field ảo
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});



//tourSchema.index({price: 1}) //single field index, tạo index cho field price , {price: 1}: sắp xếp theo tăng dần, còn -1 là giảm dần
tourSchema.index({price: 1, ratingsAverage: -1}); //compound field index
tourSchema.index({slug: 1});

tourSchema.index({startLocation: '2dsphere'}); // 2dsphere là geospatial index



tourSchema.virtual('durationWeeks').get(function(){ // field ảo được tạo tự động, không thể dùng field này trong database
    return this.duration/7; //this trỏ về dữ liệu đang thao tác( ví dụ khi thêm mới, thì dữ liệu trước khi lưu vào database chính là dữ liệu đang thao tác)
})

//Virtual populate
// field reviews ảo được tạo tự động khi trả dữ liệu về client
tourSchema.virtual('reviews',{ //reviews: tên field ảo được tạo 
    ref:'Review', // name of model want to reference
    foreignField: 'tour',//foreign model ,the name of the field in the other model, foreignField: 'tour' : tour ở đây là tour trong Review model, where the ID of the tour being stored in Review Model
    localField:'_id' //local model:where ID is actually stored here in this current Tour model
    // _id, which is how it's called in the local model, is called 'tour' in the foreign model
    // giải thích thêm 
    /*
    +)virtual populate sẽ tạo ra 1 field ảo là reviews trong đó ref:'Review' là model muốn tham chiếu đến,
    foreignField: 'tour' là field tour trong model Review, nơi có chứa id của Tour,
    //localField:'_id' là _id của Tour Model
    //nếu trong tour của Review model có chứa _id trùng với _id của Tour Model thì sẽ được hiển thị thông tin của review đó
    // chú ý: trong câu query phải có populate mới hiển thị được field ảo,
    //const tours=await features.query.populate('reviews'); reviews ở đây chính là fields ảo
    // khi thực thi đoạn trên thì field ảo reviews sẽ tự động điền thông tin review nếu có _id trong field tour ở Review model trùng với _id của Tour model 
    */
});

// Cách tạo dữ liệu thủ công
// const testTour=new Tour({
//     name:'ABC',
//     rating:4.8,
//     price: 60
// })
// testTour.save().then(doc=>{ //testTour.save() trả về promise ,testTour.save() --> lưu trên mongoDB
//     console.log(doc);
// }).catch(err=>{
//     console.log(err);
// })


//middleware trong mongoose có 4 loại:document, query,aggeration, model middleware

//DOCUMENT MIDDLEWARE runs berfore .save() and .create()
tourSchema.pre('save',function(next){// pre: chạy trước các sự kiện(hooks), sẽ lọt vào function middleware trước khi dữ liệu được lưu vào database
    //console.log(this); // this là dữ liệu đang được thêm mới có dạng là object  ( hiện ra log trước khi thêm vào database),this trỏ về dữ liệu đang thao tác
    /*
    {
        name: 'Test tour',
        duration: 1,
        maxGroupSize: 1,
        difficulty: 'medium',
        ratingsAverage: 4.5,
  ...
    }
    */
    //console.log(1);
    this.slug=slugify(this.name,{lower:true})//{lower:true} chuyển đôi thành chữ thường, trường slug có giá trị là tên tour
    next(); // next sẽ chuyển đến DOCUMENT MIDDLEWARE tiếp theo nếu có
});


//Ví dụ về DOCUMENT MIDDLEWARE
// tourSchema.pre('save',function(next){
//     console.log(2);
//     next();
// });

// tourSchema.post('save',function(doc,next){  //tourSchema.post sẽ thực thi khi các tourSchema.pre đã thực thi xong
//     console.log(3);
//     next();
// });


//post middleware functions are executed after all the pre middleware functions have completed
// tourSchema.post('save',function(doc,next){ // doc(đã được lưu vào database) là dữ liệu được truyền xuống từ tourSchema.pre, .post sẽ chạy sau khi .pre chạy hết
//     /*dữ liệu doc được truyền xuống
// {
//   name: 'Test Tour 2',
//   duration: 1,
//   ....
//   slug: 'test-tour-2',
//   __v: 0,
//   id: '62dbbcda32de812746e5fae1'
// }
//     */
//     console.log(doc);
//     next();
// })


//EMBEDDED USER INTO TOUR (khi thêm 1 tour và trường guides chứa các id của user có role 'guide'- các id này là tự nhâp, thì trước khi được lưu vào database thì sẽ thực hiện chuyển đổi các id đó thành object chứa thông tin của user đó),nhưng trường hợp này không dùng vì quá rườm rà trong việc update thông tin của user có role 'guide'
// tourSchema.pre('save',async function(next){ // async function(next) để có thể thực hiện this.guides = await Promise.all(guidesPromise);
//     //sau khi tạo 1 tour bao gồm trường guides là 1 mảng chứa cái id của user thì trước khi lưu dữ liệu tour đó vào database thì thực hiện việc tìm các user thông qua id
//     const guidesPromise = this.guides.map(async id => await User.findById(id));
//     // mỗi lần lặp qua 1 id thì async(id) return ra 1 promise vì hàm async return ra 1 promise
//     // => guidesPromise là 1 mảng chứa các phần tử là Promise
//     //console.log(guidesPromise); [Promise {}, Promise {}]
//     this.guides = await Promise.all(guidesPromise); // ghi đè thông tin trường guides từ ID của User sang thông tin của User bao gồm name, email, role, id
//     // Promise.all(guidesPromise) chạy tất cả các promise có trong guidesPromise
//     next();
// })


//QUERY MIDDLEWARE:allows to run funtions before or after a certain query is executed
tourSchema.pre(/^find/,function(next){// thực thi đối với các method bắt đầu bằng từ find, các method này giống với các method bên tourController như Tour.find, Tour.findById,...
    this.find({secretTour :{$ne: true}})//$ne= not equal(không bằng), ko hiểu thì xem lại video 105 chương 8
    this.start=Date.now(); // thêm thuộc tính vào object Query
    //console.log(this); // this trỏ đến object Query trước khi được thực thi bên tourController ( trước khi được thực thi là các đoạn code trước const tours=await features.query;)
    //console.log(1);
    next(); // next sẽ chuyển đến các QUERY MIDDLEWARE tiếp theo nếu có, trong QUERY MIDDLEWARE bắt buộc phải có next để có ther thực thi Object Query trong tourController có sử dụng find nếu ko có sẽ kẹt lại ở đây 
})

//Ví dụ QUERY MIDDLEWARE
// tourSchema.pre(/^find/,function(next){// thực thi đối với các method bắt đầu bằng từ find, các method này giống với các method bên tourController như Tour.find, Tour.findById,...
//     console.log(2)
//     next(); // next sẽ chuyển đến các QUERY MIDDLEWARE tiếp theo nếu có, trong QUERY MIDDLEWARE bắt buộc phải có next để có ther thực thi Object Query trong tourController có sử dụng find nếu ko có sẽ kẹt lại ở đây 
// })

tourSchema.pre(/^find/,function(next){
    this.populate({
        path: 'guides',
        select: '-__v' // loại bỏ trường __v trong object user
    });
    next();
})

tourSchema.post(/^find/,function(doc,next){ // tourSchema.post sẽ chạy ngay sau khi tourSchema.pre chạy xong, sau đó mới thực thi Object Query bên tourController khi thực thi các method find
    console.log(`Query took ${Date.now()-this.start} milliseconds`)
    //console.log(doc); // doc sẽ là mảng gồm nhiều phần tử object chứa thông tin tour nếu là getAllTour, sẽ là là mảng gồm 1 phần tử pbject chứa thông tin tour nếu là getTourByID
    //console.log(5);
    next();
})





//AGGREGATION MIDDLEWARE: allows to add hooks before or after an aggregation happens
// tourSchema.pre('aggregate',function(next){// this trỏ đến Aggregate Object trước khi được thực thi
//     this.pipeline().unshift({$match:{secretTour :{$ne:true}}}) // thêm 1 stage vào trước mảng
//     //console.log(this.pipeline()); // this.pipeline() dùng để xem Aggregate Object trước khi được thực thi, this.pipeline() trả ra 1 mảng
//     /*
//         _pipeline: [
//             { '$match': [Object] },
//             { '$group': [Object] },
//             { '$sort': [Object] }
//         ],
//         _model: Model { Tour },
//         options: {}
//         }
//     */
//     next();
// })

// tạo model - sử dụng schema khai báo ở trên
const Tour=mongoose.model('Tour',tourSchema) //tự động tạo Tour collection nếu chưa có, 'Tour' tên không được có chữ s sau cùng, Tour collection dùng để lưu trữ các document được tạo ra từ model tourSchema

//export ra model - Tour
// Nơi nào cần import model này--> nơi cần truy vấn, thêm, sửa, xóa  --> thư mục controller. ví dụ export model Tour thì import vào tourController
module.exports=Tour;


