require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("USER:", process.env.MAIL_USER);
  console.log("PASS:", process.env.MAIL_PASS);
  
  const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: "Test Email",
      text: "This is a test email.",
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testEmail();
