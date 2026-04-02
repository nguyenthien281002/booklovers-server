import pool from "../config/connectDB.js";

// Lấy tất cả category + subcategories
const getCategoriesWithSub = async () => {
  const [categories] = await pool.query(
    "SELECT * FROM categories WHERE is_hidden = 0 ORDER BY id DESC"
  );
  const [subcategories] = await pool.query(
    "SELECT * FROM subcategories WHERE is_hidden = 0 ORDER BY id DESC"
  );

  return categories.map((cat) => {
    const subs = subcategories.filter((sub) => sub.category_id === cat.id);
    return { ...cat, subcategories: subs };
  });
};

// CREATE category
const createCategory = async (name) => {
  if (!name) throw new Error("Thiếu name");

  const [result] = await pool.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name]
  );

  return { id: result.insertId, name, is_hidden: 0 };
};

// UPDATE category
const updateCategory = async (id, name) => {
  if (!name) throw new Error("Thiếu name");

  const [existing] = await pool.query("SELECT * FROM categories WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Category không tồn tại");

  await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);

  return { id, name };
};

// DELETE mềm category
const deleteCategory = async (id) => {
  const [existing] = await pool.query("SELECT * FROM categories WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Category không tồn tại");

  // Cập nhật is_hidden cho category
  await pool.query("UPDATE categories SET is_hidden = 1 WHERE id = ?", [id]);

  // Cập nhật is_hidden cho tất cả subcategories thuộc category này
  await pool.query(
    "UPDATE subcategories SET is_hidden = 1 WHERE category_id = ?",
    [id]
  );

  return { message: "Xoá category thành công" };
};

export default {
  getCategoriesWithSub,
  createCategory,
  updateCategory,
  deleteCategory,
};
