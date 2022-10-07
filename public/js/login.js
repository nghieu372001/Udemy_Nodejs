
import axios from 'axios'
import {showAlert} from './alert'

export const signup = async (data) =>{
    try{
        const res = await axios({
            method:'POST', 
            url:'http://127.0.0.1:3000/api/v1/users/signup',
            data: data // data send with request(gửi lên url)
        });

        if(res.data.status === 'success'){
            showAlert('success', 'Sign up successfully!')
            window.setTimeout(()=>{
                location.assign('/')
            },1500)
        }
    }
    catch(err){
        showAlert('error',err.response.data.message)
    }; 

}

export const login = async (email,password) =>{
    // console.log(email,password);
    // await axios.post('http://127.0.0.1:3000/api/v1/users/login',{
    //     email: email,
    //     password:password
    // })
    //   .then(function (response) {
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     console.log(error.response.data.message);
    //   });
    try{
        const res = await axios({
            method:'POST', 
            url:'/api/v1/users/login',
            data:{ // data send with request(gửi lên url)
                email:email, 
                password:password
            },
        });

        if(res.data.status === 'success'){
            showAlert('success', 'Logged in successfully!')
            window.setTimeout(()=>{
                location.assign('/')
            },1500)
        }
    }
    catch(err){
        showAlert('error',err.response.data.message)
        //console.log(err.response.data.message)
    }; 

}


export const logout = async (email,password) =>{
    try{
        const res = await axios({
            method:'GET',
            url:'/api/v1/users/logout',
        });

        if(res.data.status === 'success'){
            location.reload(true);
            // location.assign('/');
        }
    }
    catch(err){
        // console.log(err);
        showAlert('error','Error logging out! Try Again.')
    }; 

}