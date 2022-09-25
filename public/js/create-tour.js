import axios from 'axios'
import {showAlert} from './alert'


//type is either 'password' or 'data'
export const createNewTour = async (data) =>{
    try {
        const res = await axios({
            method:'POST',
            url: 'http://127.0.0.1:3000/api/v1/tours',
            data: data//data send with request(gửi lên url)
        });
        if(res.data.status === 'success'){
            showAlert('success', 'Create tour successfully')
        }
    }
    catch(err){
        console.log('Đã lột vào lỗi')
        showAlert('error',err.response.data.message)
    }
}