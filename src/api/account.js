//账号相关的API
import http from "@/utils/http";
export default {
    getCheckCode: (type) => http.get('/account/checkCode', { type }, {
        responseType: 'blob',
        headers: {
            'Accept': 'image/png'
        }
    }),
    VerifyCode: (type,checkCode) => http.get('/account/verifyCode', {type, checkCode }),
    SendEmailCode:(email,checkCode,type)=>http.post('/account/sendEmailCode', {email, checkCode, type }),
    Register: (user) => http.post('/account/register', user),
    Login: (user) => http.post('/account/login', user),
    VerifyToken: (token) => http.post('/account/verifyToken',{token}),
    //用户
    UpdateUserInfo: (user) => http.put('/user/updateUserInfo', user),
}