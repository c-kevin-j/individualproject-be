const nodemailer = require("nodemailer");

// transporter / fungsi untuk mengirim email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS_EMAIL,
  },
  // tls: rejectUnauthorized = false
});

module.exports = { transporter };
