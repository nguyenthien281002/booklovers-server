import pool from "../config/connectDB.js";

const getNotifications = async (user_id) => {
  const [rows] = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [user_id]
  );

  return rows;
};

const markAllAsRead = async (user_id) => {
  await pool.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE user_id = ?`,
    [user_id]
  );

  return true;
};

export default {
  getNotifications,
  markAllAsRead,
};
