const stripe = Stripe('pk_test_51LlYnHH7d2Uxmf1DpXU8RWCaz4QYkqFeuDwwXboQqF5KSECgYZEWwLub9iIS4shBu7wKeAqBcrRWuSCwybsqKqtn00EeLBA0lL')
import axios from 'axios';
import {showAlert} from './alert'

export const bookTour = async(tourID) =>{
    try{
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    
        // 2) Create checkout form + chanre credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    }
    catch(err){
        // console.log(err);
        showAlert('error',err)
    }

}