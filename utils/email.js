const nodemailer=require('nodemailer');

const sendEmail=async (options) =>{ // options là 1 object được truyền vào bởi exports.forgotPassword
    //1 Create a transporter - dịch vụ gửi email
    const transporter=nodemailer.createTransport({
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD
        }
    });
    //console.log(options.email);
    //2 Define the mail options
    const mailOptions={
        from:'Jonas Schmedmann <hello@jonas.io>',
        to:options.email,//options này từ options của function sendEmail được truyền vào
        subject:options.subject,
        text:options.message,
        //html:
    };
    //3 Actually send the email with nodemailer
    await transporter.sendMail(mailOptions); //transporter.sendMail(mailOptions) là async function return Promise
};

module.exports=sendEmail;