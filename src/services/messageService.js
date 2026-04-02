import pool from "../config/connectDB.js";

const saveMessage = async (data) => {
  const { user_id, sender_type, message } = data;

  // 1. lưu message
  const [result] = await pool.query(
    `INSERT INTO messages (user_id, sender_type, message)
     VALUES (?, ?, ?)`,
    [user_id, sender_type, message]
  );

  // 2. lấy user
  const [[user]] = await pool.query(
    `SELECT fullname, avatar FROM users WHERE id = ?`,
    [user_id]
  );

  let notification = null;

  // 3. tạo notification
  if (sender_type === "user") {
    const [notiResult] = await pool.query(
      `INSERT INTO notifications (user_id, title, content, type)
       VALUES (?, ?, ?, ?)`,
      [0, "Tin nhắn mới", `${user?.fullname}: ${message}`, "message"]
    );

    notification = {
      id: notiResult.insertId,
      user_id: 0,
      title: "Tin nhắn mới",
      content: `${user?.fullname}: ${message}`,
      type: "message",
      is_read: 0,
      created_at: new Date(),
    };
  }

  if (sender_type === "admin") {
    const [notiResult] = await pool.query(
      `INSERT INTO notifications (user_id, title, content, type)
       VALUES (?, ?, ?, ?)`,
      [user_id, "Shop phản hồi", "Bạn có tin nhắn mới từ shop", "message"]
    );

    notification = {
      id: notiResult.insertId,
      user_id,
      title: "Shop phản hồi",
      content: "Bạn có tin nhắn mới từ shop",
      type: "message",
      is_read: 0,
      created_at: new Date(),
    };
  }

  // 4. return cả message + notification
  return {
    messageData: {
      id: result.insertId,
      user_id,
      sender_type,
      message,
      is_seen: false,
      created_at: new Date(),
      fullname: user?.fullname || "User",
      avatar: user?.avatar || "",
    },
    notification,
  };
};

const getChatUsers = async () => {
  const [rows] = await pool.query(
    `
      SELECT 
      u.id,
      u.fullname,
      u.avatar,
    
      m.message AS last_message,
      m.sender_type AS last_sender,
      m.created_at AS last_time,
    
      m.is_seen,
    
      -- 👇 đếm số tin chưa đọc từ user
      (
        SELECT COUNT(*)
        FROM messages m2
        WHERE m2.user_id = u.id
          AND m2.sender_type = 'user'
          AND m2.is_seen = 0
      ) AS unread_count
    
      FROM users u
      
      JOIN messages m 
        ON m.user_id = u.id
      
      WHERE m.created_at = (
        SELECT MAX(m3.created_at)
        FROM messages m3
        WHERE m3.user_id = u.id
      )
      
      ORDER BY m.created_at DESC
      `
  );

  return rows;
};

const getMessagesByUser = async (userId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      id,
      user_id,
      sender_type,
      message,
      is_seen,
      created_at
    FROM messages
    WHERE user_id = ?
    ORDER BY created_at ASC
    `,
    [userId]
  );

  return rows;
};

const markMessagesAsSeen = async (userId) => {
  const [result] = await pool.query(
    `UPDATE messages 
     SET is_seen = 1 
     WHERE user_id = ? AND sender_type = 'user'`,
    [userId]
  );

  return result;
};

export default {
  saveMessage,
  getChatUsers,
  getMessagesByUser,
  markMessagesAsSeen,
};
