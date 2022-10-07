const nodemailer=require('nodemailer');
const pug = require('pug');
const {convert} = require('html-to-text');

module.exports = class Email { // export class Email (class Email là class tự tạo giống như AppError) - sử dụng bằng cách new Email
    constructor(user,url){
        this.to = user.email;
        this.firstName = user.name.split('')[0];
        this.url = url;
        this.from = `Nguyen Hieu <${process.env.EMAIL_FROM}>`
    }

    newTransport() {
        // nếu là production thì dùng SendGrid
        if(process.env.NODE_ENV === 'production'){
            //SendGrid
            return nodemailer.createTransport({
                service:'Gmail',
                auth:{
                    user:'nguyenhieu372001@gmail.com',
                    pass:'bypadyhxmzqqbqeh'
                }
            })
        }

        //Nếu là dev thì dùng mailtrap
        //1 Create a transporter - dịch vụ gửi email
        return nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user:process.env.EMAIL_USERNAME,
                pass:process.env.EMAIL_PASSWORD
            }
        });
    }

    //Send the actual email~
    async send(template, subject){
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{ // pug.renderFile giống render, tham số 1 là file pug cần render, tham số 2 là dữ liệu được truyền cho file pug
            firstName:this.firstName,
            url:this.url,
            subject:subject
        });

        // 2) Define email options
        const mailOptions={
            from:this.from,
            to:this.to,//options này từ options của function sendEmail được truyền vào
            subject:subject,
            html:html,
            text:convert(html,{wordwrap:false}) //html từ html:html
        };


        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);// newTransport là newTransport được khai báo ở trên, this.newTransport().sendMail(mailOptions) là async function return Promise
    }

    async sendWelcome(){
        await this.send('welcome','Welcome to the Natours Family!') // vì this.send return ra promise nên cần phải await
    }

    async passwordReset(){
        await this.send('passwordReset','Your password reset token (valid for 10 mins)')
    }
}

