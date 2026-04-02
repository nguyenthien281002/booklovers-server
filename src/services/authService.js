import jwt from "jsonwebtoken";
import pool from "../config/connectDB.js"; // dùng pool từ connectDB.js

export const findOrCreateFacebookUser = async (profile) => {
  const facebookId = profile.id;
  const email = profile.emails?.[0]?.value || "";
  const fullname = `${profile.name.givenName} ${profile.name.familyName}`;
  const avatar = profile.photos?.[0]?.value || "default.jpg";

  try {
    // 1. Kiểm tra user có tồn tại chưa
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE facebook_id = ? OR email = ? LIMIT 1",
      [facebookId, email]
    );

    let user;

    if (rows.length > 0) {
      // 2. Nếu đã có user
      user = rows[0];

      // Nếu user có email nhưng chưa có facebook_id → cập nhật
      if (!user.facebook_id) {
        await pool.execute("UPDATE users SET facebook_id = ? WHERE id = ?", [
          facebookId,
          user.id,
        ]);
      }
    } else {
      // 3. Nếu chưa có user → tạo mới
      const [result] = await pool.execute(
        "INSERT INTO users (email, fullname, avatar, facebook_id, role) VALUES (?, ?, ?, ?, ?)",
        [email, fullname, avatar, facebookId, "user"]
      );

      user = {
        id: result.insertId,
        email,
        fullname,
        avatar,
        role: "user",
      };
    }

    // 4. Tạo JWT
    const payload = {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      avatar: user.avatar,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return { ...payload, token };
  } catch (err) {
    console.error("Lỗi xử lý Facebook login:", err);
    throw err;
  }
};
