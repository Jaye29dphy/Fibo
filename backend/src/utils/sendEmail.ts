import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Hoặc dùng dịch vụ khác như Outlook, Yahoo
  auth: {
    user: process.env.EMAIL, // Email dùng để gửi
    pass: process.env.EMAIL_PASSWORD, // Mật khẩu email
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
