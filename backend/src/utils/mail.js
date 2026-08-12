import Mailgen from "mailgen";
import nodemailer from "nodemailer"

export const sendEmail = async(options) => {

  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "ChatApp",
      link: "https://mailgen.js/",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);


  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT, 
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    }
  });

  const mail = {
    from: 'mail.chatapp@gmail.com',
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail)
  } catch (error) {
    console.log(
      "Email service failed. Make sure you have provided your MAILTRAP credentials in the .env file"
    );
    console.log("Error", error);
  }
}

export const emailVerificationMailgenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our app! We're very excited to have you on board.",
      action: {
          instructions: 'To verify your email click on the following button or link:',
          button: {
              color: '#22BC66',
              text: 'Verify email',
              link: verificationUrl
          }
      },
      outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
  }
  }
}

export const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: 'We got a request to reset the password of our account.',
      action: {
          instructions: 'To reset your password click on the following button or link:',
          button: {
              color: '#22BC66',
              text: 'Reset password',
              link: passwordResetUrl
          }
      },
      outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
  }
  }
}