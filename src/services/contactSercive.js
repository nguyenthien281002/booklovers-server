import pool from "../config/connectDB.js";

const createContact = async ({ name, email, phone, message }) => {
  const [result] = await pool.query(
    `INSERT INTO contacts (name, email, phone, message, created_at) VALUES (?, ?, ?, ?, NOW())`,
    [name, email, phone, message]
  );
  return result.insertId;
};

const getAllContacts = async (page, limit) => {
  const offset = (page - 1) * limit;

  const [contacts] = await pool.query(
    `SELECT * FROM contacts 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [totalRows] = await pool.query(
    `SELECT COUNT(*) as total FROM contacts`
  );

  return {
    contacts,
    total: totalRows[0].total,
  };
};

const updateContactStatus = async (id, status) => {
  const [result] = await pool.query(
    "UPDATE contacts SET status = ? WHERE id = ?",
    [status, id]
  );

  return result.affectedRows > 0;
};

export default {
  createContact,
  getAllContacts,
  updateContactStatus,
};
