const Tour=require('../models/tourModel'); 
const Booking=require('../models/bookingModel'); 
const catchAsync=require('../utils/catchAsync');
const AppError=require('../utils/appError');
const factory=require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.getCheckOutSession = async (req,res,next) =>{
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourID)

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
        cancel_url:  `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourID,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: tour.price,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/${tour.imageCover}`],
            },
          },
          quantity: 1,
        }],
        mode: 'payment'      
    });

    // 3) Create session as response
    res.status(200).json({
        status:'success',
        session:session
    })
};

exports.createBookingCheckout = catchAsync(async (req,res,next)=>{
  //This is only temporary, because it's unsecure:everyone can make bookings without paying
  const {tour,user,price} = req.query; // <==> const tour = req.query.tour;const user = req.query.user;const price = req.query.price;

  if(!tour && !user && !price) return next() // không có 1 trong 3 chuyển đến mildeware tiếp theo

  await Booking.create({tour,user,price});

  res.redirect(req.originalUrl.split('?')[0])
});

exports.createBooking = factory.createOne(Booking) //tham số Booking la model
exports.getBooking = factory.getOne(Booking) //tham số Booking la model
exports.getAllBooking = factory.getAll(Booking) //tham số Booking la model
exports.updateBooking = factory.updateOne(Booking) //tham số Booking la model
exports.deleteBooking = factory.deleteOne(Booking) //tham số Booking la model
