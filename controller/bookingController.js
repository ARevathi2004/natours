const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour=require('../Models/tourModel');
const User=require('../Models/userModel');
const Booking=require('../Models/bookingModel');
const catchAsync=require('../utils/catchAsync');
const factory= require('./handlerFactory');


exports.getCheckoutSession=catchAsync(async(req,res,next)=>{
  // 1) Get the currently booked tour 
  const tour=await Tour.findById(req.params.tourId);

  // 2) Create chechout session
  const session= await stripe.checkout.sessions.create({
    payment_method_types:['card'],
    // success_url:`${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url:`${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url:`${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email:req.user.email,
    client_reference_id:req.params.tourId,
    line_items:[
    {
        price_data: {
            unit_amount: tour.price * 100,
            currency: 'usd',
             product_data: {
              name: `${tour.name} Tour`,
              images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
              description: tour.summary
            }
        },
        quantity: 1
    }
],
 mode: 'payment'
  });

  // 3) Create session as response
  res.status(200).json({
    status:'success',
    session
  });
});

// exports.createBookingCheckout=catchAsync(async(req,res,next)=>{
//   // This is only TEMPORARY , because it's UNSECURE : everyone can make bookings without paying 
//   const {tour,user,price}=req.query;

//   if(!tour && !user && !price) return next();

//   await Booking.create({tour,user,price});

//   res.redirect(req.originalUrl.split('?')[0]);


// });

exports.createBookingCheckout=async session=>{
  try{
  const tour=session.client_reference_id;
  const user= (await User.findOne({email:session.customer_email})).id;
  const price = session.amount_total / 100;
  
  const newBooking=await Booking.create({tour,user,price});
console.log('✅ Booking saved:', newBooking);
  } catch (err) {
    console.error('❌ Error creating booking:', err);
  }
  
};

exports.webhookCheckout=async (req,res,next)=>{
   const signature=req.headers['stripe-signature'];
   let event;
   try{
    event=stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
   }catch(err){
     console.log('❌ Invalid webhook signature:', err.message);
      return res.status(400).send(`webhook error: ${err.message}`);
   }
   console.log('✅ Webhook received:', event.type);

   if(event.type === 'checkout.session.completed'){
   console.log('🔥 Creating booking for session:', event.data.object);
    await createBookingCheckout(event.data.object).catch(err => console.error(err));
 console.error('❌ Booking creation failed:', err);
   }
   
   res.status(200).json({received:true});
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking=factory.deleteOne(Booking);
