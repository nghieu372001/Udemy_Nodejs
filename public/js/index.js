// import '@babel/polyfill'
import {login,logout,signup} from './login'
import {updateSetting} from './updateSetting'
import {bookTour} from './stripe'

//DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');


if(signupForm){
    signupForm.addEventListener('submit',(e)=>{ // nút btn mới có submit
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        signup({name,email,password,passwordConfirm});
    });
}


if(loginForm){
    loginForm.addEventListener('submit',(e)=>{ // nút btn mới có submit
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email,password);
    });
}

if(logOutBtn){
    logOutBtn.addEventListener('click',logout);
}

if(userDataForm){
    //lắng nghe sự kiện submit từ form có class .form-user-data
    userDataForm.addEventListener('submit',(e)=>{ 
        e.preventDefault();

        const form = new FormData();
        form.append('name',document.getElementById('name').value);
        form.append('email',document.getElementById('email').value);
        form.append('photo',document.getElementById('photo').files[0]);

        // for(var p of form){
        //     console.log(p);
        // }
        //updateSetting(form,'data');

        updateSetting(form,'data');
    });
}

if(userPasswordForm){
    //lắng nghe sự kiện submit từ form có class .form-user-password
    userPasswordForm.addEventListener('submit',async (e)=>{ //khi bấm save password sẽ lọt vào addEventListener
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...'


        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSetting({passwordCurrent,password,passwordConfirm},'password'); //await vì updateSetting là async function

        //sau khi cập nhật password thì làm mới cái ô nhập update  password
        document.querySelector('.btn--save-password').textContent = 'Save password'
        document.getElementById('password-current').value='';
        document.getElementById('password').value='';
        document.getElementById('password-confirm').value='';
    });
}


if(bookBtn){
    bookBtn.addEventListener('click',(e)=>{
        e.target.textContent = 'Processing...'
        const tourID = e.target.dataset.tourId //e.target: thẻ đang được click
        bookTour(tourID)
    })
}


