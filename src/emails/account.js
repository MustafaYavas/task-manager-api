// Kaydolmak veya hesabı silmek gibi şeyler için buradan mail göndereceğiz
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);   // bu API ile çalışmak istediğimizi bildiriyoruz

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "mustafayavas40@gmail.com",
        subject: "Thanks for joining us",
        text: `Welcome to the app. ${name}. Let me know how you get along with the app. Mustafa :)`
    })    
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "mustafayavas40@gmail.com",
        subject: "Sorry to see you go!",
        text: `Goodbye ${name}. I hope to see you back sometime soon`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}

// const message = {   // Bu nesnenin içinde mail'in kime gideceğinden, içeriğinin e olduğundan vb. şeyler bulunur
//     to: "mustafayavas40@gmail.com",
//     from: "mustafayavas40@gmail.com",
//     subject: "this is my new creation",
//     text: "I hope this one actually get to you"
//     // buraya html kodu da ekleyebiliriz
// }

// // send metoduna yukarıda oluşturduğumz nesneyi veriyoruz. 
// sgMail.send(message).then(() => { 
//     console.log("E-mail sent successfully!");
// }).catch((error) => {
//     console.log(error);
// })