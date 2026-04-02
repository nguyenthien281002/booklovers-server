import userService from "../services/userService.js";
import sendMail from "../helpers/send.mail.js";
require("dotenv").config();
const bcrypt = require("bcryptjs");

const otpStore = new Map();
const verifiedOTP = new Set();

const emailChangeOTPStore = new Map();
const verifiedEmailChange = new Set();

const twilio = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 1 * 60 * 1000;

    otpStore.set(email, { otp, expiresAt });

    // await sendMail(
    //   email,
    //   "Mã OTP đặt lại mật khẩu - BookLovers",
    //   `
    //     <h3>Mã OTP của bạn: <strong>${otp}</strong></h3>
    //     <p>OTP có hiệu lực trong 1 phút.</p>
    //     <p>Không chia sẻ mã này cho bất kỳ ai.</p>
    //   `
    // );

    res.status(200).json({ message: "Đã gửi OTP về email." });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error.message, error.stack);
    res.status(500).json({ message: "Lỗi server khi gửi OTP." });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record || record.otp != otp) {
    return res.status(400).json({ message: "Mã OTP không chính xác." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: "Mã OTP đã hết hạn." });
  }

  verifiedOTP.add(email);
  otpStore.delete(email);

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return res.status(200).json({ message: "Xác thực OTP thành công." });
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!verifiedOTP.has(email)) {
    return res.status(403).json({ message: "Bạn chưa xác thực OTP." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userService.updateUserPasswordByEmail(email, hashedPassword);

    verifiedOTP.delete(email);

    const subject = "Thông báo: Đổi mật khẩu thành công";
    const htmlContent = `
        <h3>Xin chào,</h3>
        <p>Bạn vừa thay đổi mật khẩu cho tài khoản của mình tại <strong>BookLovers</strong>.</p>
        <p>Nếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức (<strong>0764513977</strong>).</p>
        <p>Trân trọng,<br/>Đội ngũ BookLovers</p>
      `;

    // await sendMail(email, subject, htmlContent);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    return res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    console.error("Lỗi khi đổi mật khẩu:", err.message);
    return res
      .status(500)
      .json({ message: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
  }
};
const sendCurrentEmailOTP = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await userService.getUserById(id);
    if (!user || !user.email) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy email hiện tại." });
    }

    const currentEmail = user.email;

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 phút

    emailChangeOTPStore.set(currentEmail, { otp, expiresAt });

    // await sendMail(
    //   currentEmail,
    //   "Mã OTP xác nhận đổi email - BookLovers",
    //   `
    //     <h3>Mã OTP để đổi email: <strong>${otp}</strong></h3>
    //     <p>Mã có hiệu lực trong 2 phút.</p>
    //     <p>Không chia sẻ mã này với bất kỳ ai.</p>
    //   `
    // );
    // await new Promise((resolve) => setTimeout(resolve, 800));
    res.status(200).json({ message: "Đã gửi OTP đến email hiện tại." });
  } catch (err) {
    console.error("Lỗi gửi OTP:", err.message);
    res.status(500).json({ message: "Lỗi server khi gửi OTP." });
  }
};

const verifyCurrentEmailOTP = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userService.getUserById(userId);
    if (!user || !user.email) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy email người dùng." });
    }

    const currentEmail = user.email;
    const { otp } = req.body;
    const record = emailChangeOTPStore.get(currentEmail);

    if (!record || record.otp != otp) {
      return res.status(400).json({ message: "Mã OTP không chính xác." });
    }

    if (Date.now() > record.expiresAt) {
      emailChangeOTPStore.delete(currentEmail);
      return res.status(400).json({ message: "Mã OTP đã hết hạn." });
    }

    verifiedEmailChange.add(currentEmail);
    emailChangeOTPStore.delete(currentEmail);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return res
      .status(200)
      .json({ message: "Xác thực OTP thành công. Bạn có thể nhập email mới." });
  } catch (err) {
    console.error("Lỗi xác thực OTP:", err.message);
    res.status(500).json({ message: "Lỗi server khi xác thực OTP." });
  }
};

const updateToNewEmail = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userService.getUserById(userId);
    if (!user || !user.email) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy email người dùng." });
    }

    const currentEmail = user.email;
    const { newEmail } = req.body;

    if (!verifiedEmailChange.has(currentEmail)) {
      return res
        .status(403)
        .json({ message: "Bạn chưa xác thực OTP từ email hiện tại." });
    }

    const existing = await userService.getUserByEmail(newEmail);
    if (existing) {
      return res
        .status(400)
        .json({ message: "Email mới đã tồn tại trong hệ thống." });
    }

    await userService.updateUserEmail(currentEmail, newEmail);
    verifiedEmailChange.delete(currentEmail);

    // await sendMail(
    //   newEmail,
    //   "Xác nhận đổi email thành công - BookLovers",
    //   `
    //     <h3>Email của bạn đã được đổi thành công.</h3>
    //     <p>Nếu bạn không thực hiện thao tác này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
    //     <p>Trân trọng,<br/>Đội ngũ BookLovers</p>
    //   `
    // );
    await new Promise((resolve) => setTimeout(resolve, 800));
    return res.status(200).json({ message: "Cập nhật email mới thành công." });
  } catch (err) {
    console.error("Lỗi cập nhật email:", err.message);
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật email." });
  }
};

const sendOtpPhone = async (req, res) => {
  const { phone } = req.body;
  const phone1 = "0935546987";

  if (!phone)
    return res.status(400).json({ message: "Số điện thoại không hợp lệ" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await twilio.messages.create({
      body: `Mã OTP của bạn là: ${otp}`,
      from: "+12184223927 ",
      to: phone1.startsWith("+") ? phone1 : `+84${phone1.slice(1)}`,
    });

    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    res.status(200).json({ message: "Đã gửi mã OTP về điện thoại" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Không gửi được mã OTP" });
  }
};

const verifyOtpPhone = (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore.get(phone);

  if (!record) return res.status(400).json({ message: "Không tìm thấy OTP" });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ message: "Mã OTP đã hết hạn" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Mã OTP không đúng" });
  }

  otpStore.delete(phone); // Xác minh xong thì xoá
  res.status(200).json({ message: "Xác minh thành công!" });
};

const googleLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Missing token" });

  try {
    const result = await userService.handleGoogleLogin(token);
    res.status(200).json(result);
  } catch (err) {
    console.log("Google login error:", err.message);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

export const facebookLoginController = async (req, res) => {
  const { access_token } = req.body;
  console.log("Received access_token from frontend:", access_token);

  try {
    const result = await userService.handleFacebookLogin(access_token);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default {
  sendResetOTP,
  verifyOTP,
  resetPassword,
  sendCurrentEmailOTP,
  verifyCurrentEmailOTP,
  updateToNewEmail,
  sendOtpPhone,
  verifyOtpPhone,
  googleLogin,
  facebookLoginController,
};
