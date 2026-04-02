import pool from "../config/connectDB.js";

// ================= REVIEW =================

// tạo đánh giá
const createReview = async (data) => {
  const { product_id, user_id, rating, title, comment, media, order_item_id } =
    data;

  // 👉 insert review
  const [result] = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, title, comment, order_item_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [product_id, user_id, rating, title, comment, order_item_id]
  );

  const reviewId = result.insertId;

  // 👉 insert media
  if (media && media.length > 0) {
    const mediaValues = media.map((m) => [reviewId, m.url, m.type]);

    await pool.query(
      `INSERT INTO review_media (review_id, media_url, media_type)
         VALUES ?`,
      [mediaValues]
    );
  }

  // 👉 update order_items
  if (order_item_id) {
    await pool.query(
      `UPDATE order_items
         SET is_reviewed = 1
         WHERE id = ?`,
      [order_item_id]
    );
  }

  return reviewId;
};

// xoá đánh giá (client được xoá)
const deleteReview = async (id, currentUserId) => {
  const [result] = await pool.query(
    `UPDATE reviews 
         SET status = 'hidden', is_hidden = 1 
         WHERE id = ? AND user_id = ?`,
    [id, currentUserId]
  );

  return result.affectedRows;
};

// lấy tất cả review (kèm media)
const getAllReviews = async (page = 1, limit = 10, filters = {}) => {
  const offset = (page - 1) * limit;

  const { rating, status, search } = filters;

  // build phần WHERE động
  let whereClauses = ["r.is_hidden = 0"];
  let params = [];

  if (rating) {
    whereClauses.push("r.rating = ?");
    params.push(rating);
  }

  if (status) {
    whereClauses.push("r.status = ?");
    params.push(status);
  }

  if (search) {
    whereClauses.push("(r.title LIKE ? OR r.comment LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSQL = whereClauses.length
    ? "WHERE " + whereClauses.join(" AND ")
    : "";

  // tổng số review
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM reviews r ${whereSQL}`,
    params
  );

  // lấy review KHÔNG join media
  const [reviews] = await pool.query(
    `SELECT 
          r.*,
          u.fullname AS user_name,
          b.name AS book_name
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN books b ON r.product_id = b.id
       ${whereSQL}
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const reviewIds = reviews.map((r) => r.id);

  // lấy media riêng
  const [mediaRows] = await pool.query(
    `SELECT * FROM review_media WHERE review_id IN (?)`,
    [reviewIds.length ? reviewIds : [0]]
  );

  // map media vào review
  const reviewsMap = reviews.map((r) => ({
    ...r,
    media: mediaRows
      .filter((m) => m.review_id === r.id)
      .map((m) => ({
        id: m.id,
        url: m.media_url,
        type: m.media_type,
      })),
  }));

  return {
    reviews: reviewsMap,
    total,
  };
};

// ================= MEDIA =================

// thêm ảnh/video cho review
const addReviewMedia = async (review_id, media_url, media_type) => {
  const [result] = await pool.query(
    `INSERT INTO review_media (review_id, media_url, media_type)
     VALUES (?, ?, ?)`,
    [review_id, media_url, media_type]
  );

  return result.insertId;
};

// lấy tất cả media
const getAllMedia = async () => {
  const [rows] = await pool.query(`SELECT * FROM review_media`);
  return rows;
};

const getReviewsByBookId = async (book_id, rating = null) => {
  // 👉 1. Lấy reviews + media
  const [rows] = await pool.query(
    `SELECT 
          r.id,
          r.product_id,
          r.user_id,
          r.rating,
          r.title,
          r.comment,
          r.created_at,
          r.status,
  
          u.fullname AS user_name,
          u.avatar AS user_avatar,
  
          GROUP_CONCAT(rm.id ORDER BY rm.id) AS media_ids,
          GROUP_CONCAT(rm.media_url ORDER BY rm.id) AS media_urls,
          GROUP_CONCAT(rm.media_type ORDER BY rm.id) AS media_types
  
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN review_media rm ON r.id = rm.review_id
       WHERE r.product_id = ?
         AND r.is_hidden = 0
         AND r.status = 'visible'
         ${rating !== null ? "AND r.rating = ?" : ""}
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
    rating !== null ? [book_id, rating] : [book_id]
  );

  // 👉 2. Lấy thống kê rating
  const [ratingStats] = await pool.query(
    `SELECT 
          rating,
          COUNT(*) as count
       FROM reviews
       WHERE product_id = ?
         AND is_hidden = 0
         AND status = 'visible'
       GROUP BY rating`,
    [book_id]
  );

  // 👉 3. Chuẩn hóa counts + tính trung bình
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalS = 0;
  let sum = 0;

  ratingStats.forEach((item) => {
    ratingCounts[item.rating] = item.count;
    totalS += item.count;
    sum += item.rating * item.count;
  });

  const average_rating = totalS ? (sum / totalS).toFixed(1) : 0;
  const total = Object.values(ratingCounts).reduce((a, b) => a + b, 0);

  // 👉 4. Map reviews + media
  const reviewsMap = {};

  rows.forEach((row) => {
    if (!reviewsMap[row.id]) {
      reviewsMap[row.id] = {
        id: row.id,
        product_id: row.product_id,
        user: {
          id: row.user_id,
          name: row.user_name,
          avatar: row.user_avatar,
        },
        rating: row.rating,
        title: row.title,
        comment: row.comment,
        created_at: row.created_at,
        status: row.status,
        review_media: [],
      };
    }

    // tách media ra array
    if (row.media_ids) {
      const ids = row.media_ids.split(",");
      const urls = row.media_urls.split(",");
      const types = row.media_types.split(",");

      ids.forEach((id, idx) => {
        reviewsMap[row.id].review_media.push({
          id,
          url: urls[idx],
          type: types[idx],
        });
      });
    }
  });

  // 👉 5. Tính % rating
  const ratingPercent = {};
  for (let star = 1; star <= 5; star++) {
    ratingPercent[star] = total ? (ratingCounts[star] / total) * 100 : 0;
  }

  return {
    reviews: Object.values(reviewsMap),
    rating_summary: {
      total,
      average: Number(average_rating),
      counts: ratingCounts,
      percent: ratingPercent,
    },
  };
};

// Ẩn review (soft hide)
const toggleReviewVisibilityByAdmin = async (reviewId) => {
  const [rows] = await pool.query(`SELECT status FROM reviews WHERE id = ?`, [
    reviewId,
  ]);

  if (!rows.length) return 0;

  const currentStatus = rows[0].status;
  const newStatus = currentStatus === "hidden" ? "visible" : "hidden";

  const [result] = await pool.query(
    `UPDATE reviews SET status = ? WHERE id = ?`,
    [newStatus, reviewId]
  );

  return { affectedRows: result.affectedRows, newStatus };
};

// Xoá review (đánh dấu is_hidden = 1)
const deleteReviewByAdmin = async (reviewId) => {
  const [result] = await pool.query(
    `UPDATE reviews
         SET is_hidden = 1, status = 'hidden'
         WHERE id = ?`,
    [reviewId]
  );
  return result.affectedRows;
};

export default {
  createReview,
  deleteReview,
  getAllReviews,
  getReviewsByBookId,
  toggleReviewVisibilityByAdmin,
  deleteReviewByAdmin,
};
