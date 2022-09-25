import axios from 'axios'
import {showAlert} from './alert'




//type is either 'password' or 'data'
export const updateSetting = async (data, type) =>{
    try {
        //nếu type = 'password' thì url = '../api/v1/users/updateMyPassword' không thì url = '../api/v1/users/updateMe'

        const url = type ==='password' ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' : 'http://127.0.0.1:3000/api/v1/users/updateMe';
        const res = await axios({
            method:'PATCH',
            url: url,
            data: data//data send with request(gửi lên url)
        });
        if(res.data.status === 'success'){
            showAlert('success', `${type} updated successfully`)
        }
    }
    catch(err){
        showAlert('error',err.response.data.message)
    }
}