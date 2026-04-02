import pool from "../config/connectDB.js";

// GET ALL (giữ nguyên của bạn)
const getAllOptions = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT 
      co.id,
      co.question,
      co.answer,
      co.category_id,
      cc.name AS category_name
    FROM chat_options co
    LEFT JOIN chat_categories cc ON co.category_id = cc.id
    WHERE co.is_hidden = 0
    ORDER BY co.id DESC
    LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM chat_options WHERE is_hidden = 0`
  );

  return {
    data: rows,
    total: countResult[0].total,
  };
};

// GET ANSWER
const getAnswerById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, question, answer 
     FROM chat_options 
     WHERE id = ? AND is_hidden = 0`,
    [id]
  );

  return rows[0] || null;
};

// CREATE
const createOption = async ({ question, answer, category_id }) => {
  const [result] = await pool.query(
    `INSERT INTO chat_options (question, answer, category_id)
     VALUES (?, ?, ?)`,
    [question, answer, category_id]
  );

  return {
    id: result.insertId,
    question,
    answer,
    category_id,
  };
};

// UPDATE
const updateOption = async (id, { question, answer, category_id }) => {
  await pool.query(
    `UPDATE chat_options
     SET question = ?, answer = ?, category_id = ?
     WHERE id = ?`,
    [question, answer, category_id, id]
  );

  return {
    id,
    question,
    answer,
    category_id,
  };
};

// DELETE (soft delete)
const deleteOption = async (id) => {
  await pool.query(
    `UPDATE chat_options
     SET is_hidden = 1
     WHERE id = ?`,
    [id]
  );
};

const getCategoriesWithOptions = async () => {
  const [rows] = await pool.query(`
      SELECT 
        cc.id AS category_id,
        cc.name AS category_name,
        co.id AS option_id,
        co.question,
        co.answer
      FROM chat_categories cc
      LEFT JOIN chat_options co 
        ON cc.id = co.category_id 
        AND co.is_hidden = 0
      WHERE cc.is_hidden = 0
      ORDER BY cc.id ASC, co.id ASC
    `);

  // group lại
  const result = [];

  rows.forEach((row) => {
    let category = result.find((c) => c.id === row.category_id);

    if (!category) {
      category = {
        id: row.category_id,
        name: row.category_name,
        options: [],
      };
      result.push(category);
    }

    if (row.option_id) {
      category.options.push({
        id: row.option_id,
        question: row.question,
        answer: row.answer,
      });
    }
  });

  return result;
};

export default {
  getAllOptions,
  getAnswerById,
  createOption,
  updateOption,
  deleteOption,
  getCategoriesWithOptions,
};
