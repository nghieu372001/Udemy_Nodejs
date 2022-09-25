class APIFeatures {
    constructor(query, queryString) {
      this.query = query; // 1 object Query của mongse Query{.....}
      this.queryString = queryString; // { name: 'The Snow Adventurer' }
    }


    filter() {
      //console.log(this.query); --> Query Object có dạng: Query {_mongooseOptions: {},....}
      //console.log(this.queryString); --> {} rỗng nếu không có parameter trên URL với GET
      const queryObj = { ...this.queryString }; // <==> { name: 'The Snow Adventurer' }
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach(el => delete queryObj[el]); // nếu trong queryObj tồn tại các giá trị trong excludedFields sẽ bị xóa do đây là các trường hợp đặc biệt
  
      // 1B) Advanced filtering
      let queryStr = JSON.stringify(queryObj); // chuyển dữ liệu javascript --> Json
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => { // nếu trong queryStr có chính xác những từ này thì những từ này sẽ được thêm dấu $ đằng trước để đúng với dạng mongse
        return `$${match}`; 
      });
  
      this.query = this.query.find(JSON.parse(queryStr)); // vì this.query = Tour.find() (mà Tour.find() sẽ trả ra object Query) ==> this.query có dạng object Query nên mới .find(JSON.parse(queryStr)) được
      // nếu để Tour.find.find(JSON.parse(queryStr)) sẽ lỗi vì Tour.find([trong find phải là 1 object thì mới truy vấn được])
      // nếu muốn để .find.find ==> Tour.find(Tour.find()) *giải thích Tour.find() bên trong sẽ trả ra 1 object Query nên Tour.find() bên ngoài mới truy vấn được
  
      return this; // return this là return toàn bộ Object mà class APIFeatures tạo ra có dạng APIFeatures{query:Query {...}, queryString: {}}
      // return ra để những hàm như sort, limitFields, paginate có thể sử dụng object APIFeatures{query:Query {...}, queryString: {}}
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
      } else {
        this.query = this.query.sort('-createdAt');
      }
  
      return this;
    }
  
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-__v');
      }
  
      return this;
    }
  
    paginate() {
      const page = Number(this.queryString.page) || 1;
      const limit = Number(this.queryString.limit) || 100;
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
  
      return this;
    }
}

module.exports=APIFeatures;