// import '@babel/polyfill'
import {login,logout,signup} from './login'
import {updateSetting} from './updateSetting'
import {createNewTour} from './create-tour'

//DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const createTourForm = document.querySelector('.form--create-tour');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const inputImagesFileURL = document.getElementById('imageCover');


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

        updateSetting(form,'data');

        // const name = document.getElementById('name').value;
        // const email = document.getElementById('email').value;
        //updateSetting({name,email},'data');
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


//display image before upload
if(inputImagesFileURL){
    console.log('inputImagesFileURL');
    inputImagesFileURL.addEventListener('change',async (e)=>{
        e.preventDefault();
        const ImagesFileURL = ()=>{
            var fileSelected = document.getElementById('imageCover').files;
            if(fileSelected.length > 0){
                var fileToLoad = fileSelected[0];
                var fileReader = new FileReader();
                fileReader.onload = (e) => {
                    var srcData = e.target.result;
                    var newImage = document.createElement('img');
                    newImage.src = srcData;
                    document.getElementById('displayImg').innerHTML = newImage.outerHTML;
                }
                fileReader.readAsDataURL(fileToLoad)

            }
        };
        ImagesFileURL();
    })
};


if(createTourForm){
    createTourForm.addEventListener('submit',(e)=>{ // nút btn mới có submit
        e.preventDefault();
        const form = new FormData();
        form.append('name',document.getElementById('name').value);
        form.append('duration',document.getElementById('duration').value);
        form.append('maxGroupSize',document.getElementById('maxGroupSize').value);
        form.append('difficulty',document.getElementById('difficulty').value);
        form.append('price',document.getElementById('price').value);
        form.append('summary',document.getElementById('summary').value);
        form.append('imageCover',document.getElementById('imageCover').files[0]);

        createNewTour(form);
    });
}
