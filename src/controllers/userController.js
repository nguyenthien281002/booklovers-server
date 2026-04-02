import userService from "../services/userService";
import sendMail from "../helpers/send.mail";
import jwtDecode from "jwt-decode";
require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    const role = req.query.role || "";
    const search = req.query.search || "";
    const phone = req.query.phone || ""; // mới: filter theo số điện thoại
    const gender = req.query.gender || ""; // mới: filter theo giới tính

    // gọi service với các filter mới
    const result = await userService.getAllUsers(
      limit,
      offset,
      role,
      search,
      phone,
      gender
    );

    return res.status(200).json({
      status: "OK",
      message: "Fetched users successfully",
      data: result.users,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting users:", err);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch users",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userService.getUserById(userId);
    const addresses = await userService.getUserAddresses(userId);

    res.status(200).json({ user, addresses });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const data = await userService.getUserById(userId);

    if (!data || !data.user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({
      user: data.user,
      addresses: data.addresses,
    });
  } catch (err) {
    console.error("Error getting user by ID:", err);
    res.status(500).json({ message: "Lỗi server khi lấy người dùng" });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, fullname, role, birthday, phone, gender } =
      req.body;
    const avatar = req.file ? req.file.filename : "default.jpg";

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      fullname,
      role,
      avatar,
      birthday,
      phone,
      gender,
    };

    await userService.createUser(newUser);

    // await sendMail(
    //   email,
    //   "Chào mừng bạn đến với BookLovers!",
    //   `
    //     <h2>Xin chào ${fullname},</h2>
    //     <p>Bạn đã đăng ký tài khoản thành công tại <strong>BookLovers</strong>.</p>
    //     <p>Chúc bạn có trải nghiệm đọc sách tuyệt vời!</p>
    //     <p style="margin-top:20px;">-- BookLovers Team ❤️</p>
    //   `
    // );

    res.status(201).json({ message: "Tạo người dùng thành công" });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Lỗi server khi tạo người dùng" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname, gender, birthday } = req.body;

    const updateData = { fullname, gender, birthday };

    if (req.file) {
      updateData.avatar = req.file.filename;
    }

    const updatedUser = await userService.updateUserProfile(userId, updateData);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật người dùng" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { email, password, fullname, role, birthday, phone, gender, id } =
      req.body;

    const updateData = {
      email,
      password,
      fullname,
      role,
      birthday,
      phone,
      gender,
      id,
    };

    if (req.file) {
      updateData.avatar = req.file.filename;
    }

    const updatedUser = await userService.updateUser(updateData);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật người dùng" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedUser = await userService.deleteUser(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng để xóa" });
    }

    res.status(200).json(deletedUser);
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Lỗi server khi xóa người dùng" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userService.getUserByEmail(email);
    const isMatch = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!user || !isMatch) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res
        .status(401)
        .json({ message: "Email hoặc Mật khẩu không đúng." });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userInfo = {
      fullname: user.fullname,
      avatar: user.avatar,
    };

    await new Promise((resolve) => setTimeout(resolve, 800));
    return res.status(200).json({
      message: "Đăng nhập thành công!",
      user: userInfo,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email && !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập Email và Mật khẩu." });
    }

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập Email." });
    }

    if (!password) {
      return res.status(400).json({ message: "Vui lòng nhập Mật khẩu." });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không đúng." });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Chỉ có Admin mới được phép đăng nhập." });
    }

    const { password: _, ...userInfo } = user;

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    await new Promise((resolve) => setTimeout(resolve, 1200));
    res.status(200).json({
      message: "Đăng nhập thành công!",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

const createAddress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { fullname, phone, address, isDefault } = req.body;

    const newAddress = await userService.createAddress({
      user_id,
      fullname,
      phone,
      address,
      is_default: isDefault === true || isDefault === "true",
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    res.status(201).json({ message: "Đã tạo địa chỉ mới" });
  } catch (err) {
    console.error("Error creating address:", err);
    res.status(500).json({ message: "Lỗi server khi tạo địa chỉ" });
  }
};

const updateAddress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id, fullname, phone, address, isDefault } = req.body;

    const updatedAddress = await userService.updateAddress({
      id,
      user_id,
      fullname,
      phone,
      address,
      is_default: isDefault === true || isDefault === "true",
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    res.status(200).json({ message: "Cập nhật địa chỉ thành công" });
  } catch (err) {
    console.error("Error updating address:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật địa chỉ" });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.body;

    await userService.setDefaultAddress(user_id, id);

    res.status(200).json({ message: "Đã cập nhật địa chỉ mặc định" });
  } catch (err) {
    console.error("Error setting default address:", err);
    res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật địa chỉ mặc định" });
  }
};
const deleteAddress = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;

    await userService.deleteAddress(id, user_id);

    res.status(200).json({ message: "Xoá địa chỉ thành công" });
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ message: "Lỗi server khi xoá địa chỉ" });
  }
};

const updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userService.updatePassword(userId, hashedPassword);
    res.status(200).json({ message: "Cập nhật mật khẩu thành công." });
  } catch (err) {
    console.error("Lỗi khi cập nhật mật khẩu:", err);
    res.status(500).json({ message: "Đã xảy ra lỗi máy chủ." });
  }
};

export const getProfileAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Lỗi lấy thông tin admin:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

export const importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng chọn file",
      });
    }

    const result = await userService.importUsers(req.file.path);

    res.status(200).json({
      message: "Import users thành công",
      data: result,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      message: "Lỗi khi import users",
    });
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  loginAdmin,
  getProfile,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  updatePassword,
  getProfileAdmin,
  updateUserProfile,
  importUsers,
};
