const mongoose=require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException',err=>{
  console.log('UNCAUGHT EXCEPTION, Shutting down..... , ');
 console.log(err.name,err.message);
   process.exit(1);


});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB)
  .then(()=>{
   
    console.log("DB Connections Successful")
    });

  
  

const port = process.env.PORT || 3000;
const sever=app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection',err=>{
  console.log('UNHANDLED REJECTION , Shutting down..... , ');
  console.log(err.name,err.message);
  sever.close(()=>{
    process.exit(1);
  });
 
});


