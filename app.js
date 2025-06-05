const path=require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongoSanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
const cookieParser=require('cookie-parser');
const compression=require('compression');
const cors=require('cors');

const AppError=require('./utils/appError');
const globalErrorHandler=require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter=require('./routes/reviewRoutes');
const bookingRouter=require('./routes/bookingRoutes');
const viewRouter=require('./routes/viewRoutes');

// Start express app
const app = express();

app.set('trust proxy', 1);
app.get('/ip', (request, response) => response.send(request.ip));
app.get('/x-forwarded-for', (request, response) =>
  response.send(request.headers['x-forwarded-for']),
);

app.set('view engine', 'pug');
app.set('views',path.join(__dirname , 'views'));
app.use('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end(); // No content
});

//1) GLOBAL MIDDLEWARES
// Implement cors
app.use(cors());

// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin:'https://www.natours.com'
// }))

app.options('*',cors());
// app.options('api/v1/tours/:id',cors());

// serving static files
app.use(express.static(path.join(__dirname , 'public')));

// Set security HTTP headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://*.mapbox.com', 'https://*.stripe.com'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: [
        "'self'",
        'https://js.stripe.com/v3',
        'https://cdnjs.cloudflare.com',
        'https://api.mapbox.com',
        'blob:',
      ],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", 'https://*.stripe.com/'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  })
 );
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter=rateLimit({
  max:100,
  windowMs:60*60*1000,
  message:'Too many request to this IP,Please try again in hour'
});
app.use('/api',limiter);

// Body parser ,reading data from body into req.body
app.use(express.json({limit:'10kb'}));
app.use(express.urlencoded({extended:true, limit:'10kb'}));
app.use(cookieParser());

// Data Sanitization against Nosql query injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp({
  whitelist:[
    'duration','ratingAverage','ratingQuantity','difficulty','maxGroupSize','price'
  ]
}));

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//3)ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*',(req,res,next)=>{
  //console.log(req.originalUrl.includes('/.well-known/appspecific'));
  next(new AppError(`Can't find ${req.originalUrl} on this server!`,404));
});

app.use(globalErrorHandler);

module.exports = app;
