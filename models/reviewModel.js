const mongoose=require('mongoose');
const Tour = require('./tourModel');

const reviewSchema=new mongoose.Schema({  
    review: {
        type:String,
        required:[true,'Review can not be empty']
    }, 
    rating: {
        type:Number, 
        min: 1, // rating cao nhất là 5, thấp nhất là 1
        max: 5
    },
    createAt:{
        type:Date,
        default:Date.now()
    },
    // guides: Array: EMBEDDED USER INTO TOUR, -- không dùng
    tour:{// review về tour nào
        type: mongoose.Schema.ObjectId, // mỗi object sẽ có 1 id mongoID (vd: _id: "5c88fa8cf4afda39709c296f")
        ref: 'Tour', // tham chiếu đến USER, khi truy vấn (client) đến các route Tour thì trong JSON trả về thì field guides sẽ là 1 array gồm các object chứa thông tin của user, còn user nào sẽ xuất hiện dựa vào object trong field guides được thêm vào bên mongodb
        required: [true,'Review must belong to a tour']
    },
    user:{ // review thuộc về user nào
        type: mongoose.Schema.ObjectId, // mỗi object sẽ có 1 id mongoID (vd: _id: "5c88fa8cf4afda39709c296f")
        ref: 'User', // tham chiếu đến USER, khi truy vấn (client) đến các route Tour thì trong JSON trả về thì field guides sẽ là 1 array gồm các object chứa thông tin của user, còn user nào sẽ xuất hiện dựa vào object trong field guides được thêm vào bên mongodb
        required: [true,'Review must belong to a user']
    },


},{ 
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});


reviewSchema.index({tour:1,user:1},{unique:true}) // tạo compound index,  {unique:true}:options, giúp 1 user chỉ review 1 tour được 1 lần, nếu 1 user review 1 tour 2 lần thì sẽ báo lỗi


reviewSchema.pre(/^find/,function(next){
    // this.populate({path:'tour',select:'name'}).populate({path:'user',select:'name photo'}); 
    this.populate({path:'user',select:'name photo'}); // select: chỉ hiển thị các trường name,photo
    //path:'user' chỉ thay thế _id của field tour bằng thông tin của user có _id đó, còn field tour không có path nên chỉ xuất hiện _id 
    next();
});


//Statics Method
reviewSchema.statics.calcAverageRatings =async function(tourId){//reviewSchema.statics: cú pháp của statics, còn calcAverageRatings là tên hàm
    // console.log(tourId); //new ObjectId("6326baf877c3155782680d70"), khi user create review on tour thì tourId = :id (/:id/reviews)
    //console.log(this);  //Model { Review }
    //this.aggregate là 1 hàm return ra promise
    const stats = await this.aggregate([//this actually points to the current model nên có thể sử dụng this.aggregate(), aggregate chỉ được sử dụng bởi model giống như Tour.aggregate
        //State 1: select all the reviews that actually belong to the current tour that was passed in as the argument function(tourId)
        {
            $match: {tour : tourId}  // lấy document trong collect review có field tour = tourID truyền vào 
        },
        //State 2: Calculate the statistics
        {
            $group: {
                _id:'$tour', //nhóm theo field tour trong các document Review (tương tư group by)
                nRating:{$sum:1}, //đếm số lượng review của tour đó, để thực hiện việc tính toán thì mỗi lần lặp qua 1 review về tour đó thì nRating sẽ tăng lên 1
                avgRating:{$avg:'$rating'} // tính trung bình cộng rating reivew của tour đó
            }
        }
    ]);
    console.log(stats);
    /*
    console.log(stats);
    [
        {
            _id: new ObjectId("6326baf877c3155782680d70"),
            nRating: 2,
            avgRating: 4.5
        }
    ]
    */

    //sau khi tính xong thì cập nhật lại ratingsAverage, ratingsQuantity trong tour có id = tourId
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: stats[0].nRating, 
            ratingsAverage: stats[0].avgRating
        }); 
    }
    else { // không có review nào trong tour thì set lại giá trị mặc định
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: 0, 
            ratingsAverage: 4.5
        }); 
    }
};


//reviewSchema.post because all the document are already saved in the database and so that's then a great time to actually do this calculation with all the reviews already and then store the result on the tour
reviewSchema.post('save',function() { //reviewSchema.post không thể sử dụng next
    //this points to current review
    //this.constructor is model of the current document --> Review
    this.constructor.calcAverageRatings(this.tour);
    /*
    tại sao không dùng this.calcAverageRatings(this.tour); bởi vì calcAverageRatings là 1 Statics Method, bên trong hàm calcAverageRatings cần có Model để sử dụng aggregate(aggregate hoạt động khi Model.aggregate)
    mà dùng this chỉ trỏ về the current document nên dùng this.constructor để trỏ về model của the current document
    */
});


//findByIdAndUpdate is only just a shorthand for findOneAndUpdate with the current ID
//findByIdAndDelete

//QUERY MIDDLEWARE -- thực hiện khi sửa xóa review thì cập nhật lại ratingsAverage, ratingsQuantity
reviewSchema.pre(/^findOneAnd/,async function(next){
    //this keyword is the current query
    this.r =await this.findOne().clone();   
    /*
    console.log(this.r); // trả về data ($OldValue) tại thời điểm trước khi sửa đổi, giống $OldValue $NewValue tại công ty fast
    {
    _id: new ObjectId("6326d1b0e971dffd19ef6398"),
    review: 'Amazing !!!',
    rating: 5,
    createAt: 2022-09-18T08:06:14.739Z,
    tour: new ObjectId("6326baf877c3155782680d70"),
    user: {
        _id: new ObjectId("5c8a1dfa2f8fb814b56fa181"),
        name: 'Lourdes Browning',
        photo: 'user-2.jpg'
    },
    __v: 0,
    id: '6326d1b0e971dffd19ef6398'
    }
    */
    next();
})

reviewSchema.post(/^findOneAnd/,async function(next){
    //this keyword is the current query
    await this.r.constructor.calcAverageRatings(this.r.tour)  // this.r.constructor = Review
})


const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;