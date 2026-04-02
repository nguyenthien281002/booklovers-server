import pool from "../config/connectDB.js";
import XLSX from "xlsx";

const getAllPromotions = async (
  limit,
  offset,
  discount_type,
  search,
  status
) => {
  let query = `
    SELECT 
      p.*,
      CASE
        WHEN NOW() < p.start_date THEN 'upcoming'
        WHEN NOW() BETWEEN p.start_date AND p.end_date THEN 'active'
        ELSE 'expired'
      END AS computed_status
    FROM promotion p
    WHERE p.is_hidden = 0
  `;

  let countQuery = `SELECT COUNT(*) as total FROM promotion WHERE is_hidden = 0`;

  const params = [];
  const countParams = [];

  // filter discount_type
  if (discount_type) {
    query += ` AND p.discount_type = ?`;
    countQuery += ` AND discount_type = ?`;

    params.push(discount_type);
    countParams.push(discount_type);
  }

  // search
  if (search) {
    query += ` AND (p.code LIKE ? OR p.description LIKE ?)`;
    countQuery += ` AND (code LIKE ? OR description LIKE ?)`;

    const keyword = `%${search}%`;

    params.push(keyword, keyword);
    countParams.push(keyword, keyword);
  }

  // 👉 filter status (quan trọng)
  if (status) {
    query += ` HAVING computed_status = ?`;
    params.push(status);

    // countQuery phải viết lại logic giống CASE
    countQuery += `
      AND (
        (? = 'upcoming' AND NOW() < start_date)
        OR (? = 'active' AND NOW() BETWEEN start_date AND end_date)
        OR (? = 'expired' AND NOW() > end_date)
      )
    `;
    countParams.push(status, status, status);
  }

  query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countRows] = await pool.query(countQuery, countParams);

  const promotions = rows.map((row) => ({
    ...row,
    status: row.computed_status,
  }));

  return {
    promotions,
    total: countRows[0].total,
  };
};

const getPromotionByCode = async (code) => {
  // 1️⃣ Update status trước
  await pool.query(
    `UPDATE promotion
     SET status = CASE
       WHEN NOW() < start_date THEN 'upcoming'
       WHEN NOW() BETWEEN start_date AND end_date THEN 'active'
       ELSE 'expired'
     END
     WHERE code = ?`,
    [code]
  );

  // 2️⃣ Lấy promotion
  const [rows] = await pool.query(
    `SELECT * FROM promotion
     WHERE code = ?
     AND status = 'active'
     AND is_hidden = 0
     AND (usage_limit IS NULL OR used_count < usage_limit)`,
    [code]
  );

  return rows[0];
};

const createPromotion = async (data) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    start_date,
    end_date,
    usage_limit,
  } = data;

  const now = new Date();

  let status = "upcoming";

  if (now >= new Date(start_date) && now <= new Date(end_date)) {
    status = "active";
  } else if (now > new Date(end_date)) {
    status = "expired";
  }

  const [result] = await pool.query(
    `INSERT INTO promotion 
    (code, description, discount_type, discount_value, start_date, end_date, usage_limit, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      usage_limit,
      status,
    ]
  );

  return result.insertId;
};

const updatePromotion = async (data) => {
  const {
    id,
    code,
    description,
    discount_type,
    discount_value,
    start_date,
    end_date,
    usage_limit,
  } = data;

  const now = new Date();

  let status = "upcoming";

  if (now >= new Date(start_date) && now <= new Date(end_date)) {
    status = "active";
  } else if (now > new Date(end_date)) {
    status = "expired";
  }

  const [result] = await pool.query(
    `UPDATE promotion
     SET code = ?, 
         description = ?, 
         discount_type = ?, 
         discount_value = ?,
         start_date = ?, 
         end_date = ?, 
         usage_limit = ?, 
         status = ?
     WHERE id = ?`,
    [
      code,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      usage_limit,
      status,
      id,
    ]
  );

  return result;
};

const deletePromotion = async (id) => {
  const [result] = await pool.query(
    `UPDATE promotion SET is_hidden = 1 WHERE id = ?`,
    [id]
  );

  return result;
};

export const importPromotions = async (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const promotions = XLSX.utils.sheet_to_json(sheet);

  const createdPromotions = [];
  const skippedPromotions = [];

  for (const item of promotions) {
    // kiểm tra code tồn tại
    const [existing] = await pool.query(
      "SELECT id FROM promotion WHERE code = ?",
      [item.code]
    );

    if (existing.length > 0) {
      skippedPromotions.push({
        code: item.code,
        reason: "Code đã tồn tại",
      });
      continue;
    }

    const [result] = await pool.query(
      `INSERT INTO promotion
      (code, description, discount_type, discount_value, usage_limit, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.code,
        item.description || "",
        item.discount_type || "percent",
        item.discount_value || 0,
        item.usage_limit || 0,
        item.start_date,
        item.end_date,
        item.is_active ?? 1,
      ]
    );

    createdPromotions.push({
      id: result.insertId,
      code: item.code,
    });
  }

  return {
    created: createdPromotions,
    skipped: skippedPromotions,
  };
};

export default {
  getPromotionByCode,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAllPromotions,
  importPromotions,
};
