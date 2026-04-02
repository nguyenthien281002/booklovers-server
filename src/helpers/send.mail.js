const nodemailer = require("nodemailer");
require("dotenv").config();

const sendMail = async (to, subject, htmlContent) => {
  try {
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_APP_PASSWORD = process.env.EMAIL_PASS;

    if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
      throw new Error("Missing EMAIL_USER or EMAIL_APP_PASSWORD env values");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // hoặc 465 + secure: true
      secure: false,
      requireTLS: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD, // PHẢI là App Password (16 ký tự), không phải mật khẩu Gmail thường
      },
      connectionTimeout: 10000,
      socketTimeout: 20000,
      family: 4, // ép IPv4 để tránh trục trặc IPv6
    });

    await transporter.verify(); // sẽ throw nếu không bắt tay được

    await transporter.sendMail({
      from: `"BookLovers" <${EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Failed to send email:", {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    throw error;
  }
};

module.exports = sendMail;
