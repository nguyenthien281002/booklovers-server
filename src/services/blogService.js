import pool from "../config/connectDB.js";

const getAllBlogsPage = async (limit, offset, is_featured, search, status) => {
  // 1️⃣ Tự động cập nhật status nếu đến ngày đăng
  await pool.query(`
    UPDATE blogs
    SET status = 'PUBLISHED'
    WHERE status = 'DRAFT'
      AND date <= CURDATE()
  `);

  // 2️⃣ Query chính
  let query = `
    SELECT 
      id,
      title,
      author,
      is_featured,  
      description,
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      status,
      is_hidden,
      image
    FROM blogs
    WHERE is_hidden = 0
  `;
  let countQuery = `SELECT COUNT(*) as total FROM blogs WHERE is_hidden = 0`;

  const params = [];
  const countParams = [];

  // filter featured
  if (is_featured !== undefined) {
    query += ` AND is_featured = ?`;
    countQuery += ` AND is_featured = ?`;

    params.push(is_featured);
    countParams.push(is_featured);
  }

  // filter status
  if (status) {
    query += ` AND status = ?`;
    countQuery += ` AND status = ?`;

    params.push(status);
    countParams.push(status);
  }

  // search title và author
  if (search) {
    query += ` AND (title LIKE ? OR author LIKE ?)`;
    countQuery += ` AND (title LIKE ? OR author LIKE ?)`;

    const keyword = `%${search}%`;
    params.push(keyword, keyword);
    countParams.push(keyword, keyword);
  }

  // phân trang
  query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [countRows] = await pool.query(countQuery, countParams);

  return {
    blogs: rows,
    total: countRows[0].total,
  };
};

const getAllBlogsForClientPage = async (page = 1, limit = 10) => {
  // 1️⃣ Tự động update các bài DRAFT đến ngày đăng
  await pool.query(`
    UPDATE blogs
    SET status = 'PUBLISHED'
    WHERE status = 'DRAFT'
      AND date <= CURDATE()
  `);

  const offset = (page - 1) * limit;

  // 2️⃣ Lấy các bài PUBLISHED đã phân trang
  const [rows] = await pool.query(
    `
    SELECT 
      id,
      title,
      description,
      author,
      is_featured,
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      status,
      image
    FROM blogs
    WHERE status = 'PUBLISHED'
      AND is_hidden = 0
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `,
    [limit, offset]
  );

  // 3️⃣ Lấy tổng số bài
  const [countRows] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM blogs
    WHERE status = 'PUBLISHED'
      AND is_hidden = 0
  `);

  return {
    blogs: rows,
    total: countRows[0].total,
    page,
    limit,
    totalPages: Math.ceil(countRows[0].total / limit),
  };
};

const getFeaturedBlogs = async () => {
  // 1️⃣ Tự động update status cho các bài DRAFT đến ngày đăng
  await pool.query(`
    UPDATE blogs
    SET status = 'PUBLISHED'
    WHERE is_featured = 1
      AND status = 'DRAFT'
      AND date <= CURDATE()
  `);

  // 2️⃣ Lấy các bài nổi bật hiện tại
  const [rows] = await pool.query(`
    SELECT 
      id,
      title,
      description,
      author,
      is_featured,
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      status,
      image
    FROM blogs
    WHERE is_featured = 1 
      AND is_hidden = 0
      AND status = 'PUBLISHED'
    ORDER BY date DESC
  `);

  return rows;
};

// Lấy blog theo ID
const getBlogById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM blogs WHERE id = ?", [id]);
  return rows[0] || null;
};

// Tạo blog mới
const createBlog = async (data) => {
  const { title, description, image, author, is_featured, date, is_hidden } =
    data;

  // Xác định status
  let status;
  if (is_hidden === 1) {
    status = "ARCHIVED"; // ẩn bài
  } else {
    const today = new Date();
    const blogDate = new Date(date);
    status = blogDate <= today ? "PUBLISHED" : "DRAFT";
  }

  const [result] = await pool.query(
    `INSERT INTO blogs (title, description, image, author, date, is_featured, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, image, author, date, is_featured, status]
  );

  return await getBlogById(result.insertId);
};

const updateBlog = async (data) => {
  const {
    title,
    description,
    image,
    author,
    is_featured,
    date,
    id,
    is_hidden,
  } = data;

  // Xác định status
  let status;
  if (is_hidden === "1") {
    status = "ARCHIVED";
  } else {
    const today = new Date();
    const blogDate = new Date(date);
    status = blogDate <= today ? "PUBLISHED" : "DRAFT";
  }

  if (image) {
    await pool.query(
      `UPDATE blogs 
       SET title = ?, description = ?, image = ?, author = ?, date = ?, is_featured = ?, status = ?
       WHERE id = ?`,
      [title, description, image, author, date, is_featured, status, id]
    );
  } else {
    await pool.query(
      `UPDATE blogs 
       SET title = ?, description = ?, author = ?, date = ?, is_featured = ?, status = ?
       WHERE id = ?`,
      [title, description, author, date, is_featured, status, id]
    );
  }

  return await getBlogById(id);
};

// Xóa blog
const deleteBlog = async (id) => {
  const blog = await getBlogById(id);
  if (!blog) return null;

  await pool.query("UPDATE blogs SET is_hidden = 1 WHERE id = ?", [id]);

  return blog;
};

export default {
  getAllBlogsPage,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getAllBlogsForClientPage,
};
