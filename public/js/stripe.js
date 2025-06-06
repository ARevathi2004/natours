import axios from 'axios';
import { showAlert } from './alerts';
// const Stripe = require('stripe');
const stripe=Stripe('pk_test_51RMlKLFbMTFsnIKY41sccFq2jQasbHNsrOZ8b4EWYddflaC104n2urMv01cDkwDj56IcR4gUipIFSyBNrrhdBln800LxbaP1pT');

export const bookTour=async tourId=>{
    try{
        // 1) Get checkout session from API
    const session =await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);
   
   
    // 2) Create checkout form + chanre credit card
      await stripe.redirectToCheckout({
        sessionId:session.data.session.id
      });

    }catch(err){
        //console.log(err);
        showAlert('error',err);
    }
    
}

