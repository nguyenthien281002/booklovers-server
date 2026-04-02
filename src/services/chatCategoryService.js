import pool from "../config/connectDB.js";

// GET ALL
const getAllCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, name FROM chat_categories WHERE is_hidden = 0 ORDER BY id DESC`
  );
  return rows;
};

// CREATE
const createCategory = async (name) => {
  const [result] = await pool.query(
    `INSERT INTO chat_categories (name) VALUES (?)`,
    [name]
  );

  return {
    id: result.insertId,
    name,
  };
};

// UPDATE
const updateCategory = async (id, name) => {
  await pool.query(`UPDATE chat_categories SET name = ? WHERE id = ?`, [
    name,
    id,
  ]);

  return { id, name };
};

// DELETE
const deleteCategory = async (id) => {
  await pool.query(
    `UPDATE chat_categories 
       SET is_hidden = 1 
       WHERE id = ?`,
    [id]
  );
};

export default {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
