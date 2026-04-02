import pool from "../config/connectDB.js";

const getSystemSettings = async () => {
  const [rows] = await pool.query("SELECT * FROM system_settings WHERE id = 1");
  return rows[0] || null;
};

const updateSystemSettings = async (data) => {
  // Lấy logo cũ nếu data.logo không có
  let logo = data.logo;

  if (!logo) {
    const [rows] = await pool.query(
      "SELECT logo FROM system_settings WHERE id = 1"
    );
    logo = rows[0]?.logo || null;
  }

  const {
    hotline,
    email,
    address,
    zalo,
    facebook,
    instagram,
    tiktok,
    youtube,
    google_map_link,
  } = data;

  const [result] = await pool.query(
    `UPDATE system_settings SET 
        logo = ?, hotline = ?, email = ?, address = ?, zalo = ?, 
        facebook = ?, instagram = ?, tiktok = ?, youtube = ?, google_map_link = ?,
        updated_at = NOW()
       WHERE id = 1`,
    [
      logo,
      hotline,
      email,
      address,
      zalo,
      facebook,
      instagram,
      tiktok,
      youtube,
      google_map_link,
    ]
  );

  return result;
};

export default {
  getSystemSettings,
  updateSystemSettings,
};
