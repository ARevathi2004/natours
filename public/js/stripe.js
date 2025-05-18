import axios from 'axios';
import { showAlert } from './alerts';
// const Stripe = require('stripe');
const stripe=Stripe('pk_test_51RMlOzPK7Y451sAcr4D4vml6B1V7I48GG9BMV4fK3ODKOXpcLtlfoZivU4Mowb7ObjvuFf5NmlQbrrBrDdHqSVm9002jNxvAVc');

export const bookTour=async tourId=>{
    try{
        // 1) Get checkout session from API
    const session =await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
   
   
    // 2) Create checkout form + chanre credit card
      await stripe.redirectToCheckout({
        sessionId:session.data.session.id
      });

    }catch(err){
        console.log(err);
        showAlert('error',err);
    }
    
}

