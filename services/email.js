const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'premium6.web-hosting.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = ({
  to,
  subject,
  body,
  isHtml = false,
}) => {
  //console.log(transporter);

  transporter.sendMail({
    from: 'system@idli.space',
    to,
    subject,
    ...(isHtml ? { html: body } : { text: body}),
  });
}