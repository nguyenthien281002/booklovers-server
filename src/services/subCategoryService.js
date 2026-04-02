import pool from "../config/connectDB.js";

// Lấy tất cả subcategory
const getAllSubcategories = async () => {
  const [rows] = await pool.query(`
    SELECT 
      s.id,
      s.name,
      s.category_id,
      c.name AS category_name
    FROM subcategories s
    LEFT JOIN categories c ON s.category_id = c.id
    ORDER BY s.id DESC
  `);

  return rows;
};

// Tạo subcategory
const createSubcategory = async (data) => {
  const { name, category_id } = data;

  if (!name || !category_id) {
    throw new Error("Thiếu name hoặc category_id");
  }

  const [result] = await pool.query(
    `INSERT INTO subcategories (name, category_id) VALUES (?, ?)`,
    [name, category_id]
  );

  return {
    id: result.insertId,
    name,
    category_id,
  };
};

// Cập nhật subcategory
const updateSubcategory = async (id, name) => {
  if (!name) {
    throw new Error("Thiếu name");
  }

  const [existing] = await pool.query(
    `SELECT * FROM subcategories WHERE id = ?`,
    [id]
  );

  if (existing.length === 0) {
    throw new Error("Subcategory không tồn tại");
  }

  await pool.query(`UPDATE subcategories SET name = ? WHERE id = ?`, [
    name,
    id,
  ]);

  return {
    id,
    name,
  };
};

// Xoá subcategory
const deleteSubcategory = async (id) => {
  const [existing] = await pool.query(
    `SELECT * FROM subcategories WHERE id = ?`,
    [id]
  );

  if (existing.length === 0) {
    throw new Error("Subcategory không tồn tại");
  }

  // "Xóa" mềm bằng cách ẩn
  await pool.query(`UPDATE subcategories SET is_hidden = 1 WHERE id = ?`, [id]);

  return { message: "Xoá thành công" };
};

// EXPORT DEFAULT
export default {
  getAllSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
