import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

export const sendEmail = async (to: string, text: string) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: 'OTP xác thực',
    text,
  });
};
