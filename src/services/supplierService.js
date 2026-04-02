import pool from "../config/connectDB.js";

const createSupplier = async (data) => {
  const { name, phone, email, address } = data;

  const [result] = await pool.query(
    `INSERT INTO suppliers (name, phone, email, address)
     VALUES (?, ?, ?, ?)`,
    [name, phone, email, address]
  );

  return result.insertId;
};

const checkEmailExists = async (email) => {
  const [rows] = await pool.query(
    `SELECT id FROM suppliers 
     WHERE email = ? AND is_hidden = 0`,
    [email]
  );

  return rows.length > 0;
};

const getAllSuppliers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // Lấy data
  const [rows] = await pool.query(
    `SELECT * FROM suppliers 
     WHERE is_hidden = 0 
     ORDER BY id DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  // Đếm tổng record
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM suppliers 
     WHERE is_hidden = 0`
  );

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllSuppliersNoPaging = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM suppliers 
     WHERE is_hidden = 0 
     ORDER BY id DESC`
  );

  return rows;
};

const updateSupplier = async (id, data) => {
  const { name, phone, email, address } = data;

  const [result] = await pool.query(
    `UPDATE suppliers 
     SET name = ?, phone = ?, email = ?, address = ?
     WHERE id = ? AND is_hidden = 0`,
    [name, phone, email, address, id]
  );

  return result.affectedRows;
};

const deleteSupplier = async (id) => {
  const [result] = await pool.query(
    `UPDATE suppliers 
     SET is_hidden = 1 
     WHERE id = ?`,
    [id]
  );

  return result.affectedRows;
};

export default {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  checkEmailExists,
  getAllSuppliersNoPaging,
};
