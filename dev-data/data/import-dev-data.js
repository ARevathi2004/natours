const fs=require('fs');
const mongoose=require('mongoose');
const dotenv=require('dotenv');
const Tour=require('./../../Models/tourModel');
const User=require('./../../Models/userModel');
const Review=require('./../../Models/reviewModel');
const slugify = require('slugify');

dotenv.config({ path: './config.env' });


mongoose.connect(process.env.DATABASE)
  .then(()=>{
   
    console.log("DB Connections Successful");
  });

  // READ JSON FILE
  const tours=JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
  const users=JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
  const reviews=JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

  
 tours.forEach(tour => {
  tour.slug = slugify(tour.name, { lower: true });
});


  //IMPORT DATA INTO DB

  const importData=async()=>{
    try{
        
        await Tour.create(tours);
        await User.create(users,{ validateBeforeSave:false});
        await Review.create(reviews);
        console.log('Data successfully loaded');
        
    }catch(err){
        console.log(err);
    }
    process.exit();
  };
console.log(await User.find())
  // DELETE ALL DATA FROM DB
  const deleteData=async()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted');
      
    }catch(err){
        console.log(err);
    }
    process.exit();
};

if (process.argv[2] === '--import'){
    importData();
} else if(process.argv[2] === '--delete'){
    deleteData();
}