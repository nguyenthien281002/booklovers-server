import pool from "../config/connectDB.js";
const fs = require("fs");
const path = require("path");

const getAllBooks = async (
  limit,
  offset,
  sort,
  search,
  priceRanges,
  categoryId,
  subcategoryId
) => {
  let whereClause = "WHERE b.is_hidden = 0";
  const values = [];

  if (search) {
    whereClause += " AND b.name LIKE ?";
    values.push(`%${search}%`);
  }

  if (categoryId) {
    whereClause += " AND b.category_id = ?";
    values.push(categoryId);
  }

  if (subcategoryId) {
    whereClause += " AND b.subcategory_id = ?";
    values.push(subcategoryId);
  }

  const priceConditions = priceRanges
    .map((range) => {
      switch (range) {
        case "under-100":
          return "(b.price * (1 - b.discount / 100)) < 100000";
        case "100-400":
          return "(b.price * (1 - b.discount / 100)) BETWEEN 100000 AND 400000";
        case "400-800":
          return "(b.price * (1 - b.discount / 100)) BETWEEN 400000 AND 800000";
        case "above-800":
          return "(b.price * (1 - b.discount / 100)) > 800000";
        default:
          return "";
      }
    })
    .filter(Boolean);

  if (priceConditions.length > 0) {
    whereClause += ` AND (${priceConditions.join(" OR ")})`;
  }

  let sortClause = "";
  switch (sort) {
    case "newest":
      sortClause = "ORDER BY b.created_at DESC";
      break;
    case "discount-desc":
      whereClause += " AND b.discount > 0";
      sortClause = "ORDER BY b.discount DESC";
      break;
    case "price-asc":
      sortClause = "ORDER BY (b.price * (1 - b.discount / 100)) ASC";
      break;
    case "price-desc":
      sortClause = "ORDER BY (b.price * (1 - b.discount / 100)) DESC";
      break;
    default:
      sortClause = "";
  }

  // trước khi chạy query:
  let finalSortClause = sortClause || "ORDER BY b.id DESC";

  const [rows] = await pool.query(
    `SELECT 
        b.*, 
        bd.barcode,
        bd.supplier_name,
        bd.authors,
        bd.publisher,
        bd.published_year,
        bd.language,
        bd.weight_gram,
        bd.dimensions,
        bd.page_count,
        bd.cover_type,
  
        i.image_url AS main_image, 
        c.name AS category_name,
        sc.name AS subcategory_name
  
     FROM books b
  
     LEFT JOIN book_details bd ON b.id = bd.book_id
     LEFT JOIN book_images i ON b.id = i.book_id AND i.is_main = 1
     LEFT JOIN categories c ON b.category_id = c.id
     LEFT JOIN subcategories sc ON b.subcategory_id = sc.id
     
  
     ${whereClause}
     ${finalSortClause}
     
     LIMIT ? OFFSET ?`,
    [...values, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM books b ${whereClause}`,
    values
  );

  const bookIds = rows.map((row) => row.id);

  let imagesMap = {};

  if (bookIds.length > 0) {
    const [imageRows] = await pool.query(
      `SELECT id, book_id, image_url
     FROM book_images
     WHERE book_id IN (?) AND is_main = 0`,
      [bookIds]
    );

    imageRows.forEach((img) => {
      if (!imagesMap[img.book_id]) {
        imagesMap[img.book_id] = [];
      }

      imagesMap[img.book_id].push({
        id: img.id,
        image_url: img.image_url,
      });
    });
  }

  const books = rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    discount: row.discount,
    description: row.description,
    main_image: row.main_image,
    quantity: row.quantity,
    sold: row.sold,

    images: imagesMap[row.id] || [],

    category: {
      id: row.category_id,
      name: row.category_name,
    },

    subcategory: {
      id: row.subcategory_id,
      name: row.subcategory_name,
    },

    book_detail: {
      barcode: row.barcode,
      supplier_name: row.supplier_name,
      authors: row.authors,
      publisher: row.publisher,
      published_year: row.published_year,
      language: row.language,
      weight_gram: row.weight_gram,
      dimensions: row.dimensions,
      page_count: row.page_count,
      cover_type: row.cover_type,
    },
  }));

  return {
    books,
    total: countRows[0].total,
  };
};

const getAllBooksNoPaging = async () => {
  const [rows] = await pool.query(
    "SELECT id, name, price FROM books WHERE is_hidden = 0 ORDER BY id DESC"
  );
  return rows;
};

const getBookById = async (id) => {
  // Lấy thông tin book chính
  const [bookRows] = await pool.query(`SELECT * FROM books WHERE id = ?`, [id]);
  const book = bookRows[0];

  if (!book) return null;

  // Lấy chi tiết book
  const [detailRows] = await pool.query(
    `SELECT * FROM book_details WHERE book_id = ?`,
    [id]
  );
  const bookDetail = detailRows[0] || null;

  // Lấy danh sách hình ảnh
  const [imageRows] = await pool.query(
    `SELECT image_url, is_main FROM book_images WHERE book_id = ?`,
    [id]
  );
  const bookImages = imageRows;

  return {
    book,
    bookDetail,
    bookImages,
  };
};

const cleanInt = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const cleanDiscount = (v) => {
  if (v === "" || v === null || v === undefined) return 0;

  const n = Number(v);
  if (Number.isNaN(n)) return 0;

  // chặn giá trị bất hợp lý
  if (n < 0) return 0;
  if (n > 100) return 100;

  return n;
};

// Thêm sách mới
const createBook = async (bookData, mainImage, subImages) => {
  const {
    name,
    category_id,
    subcategory_id,
    price,
    discount,
    description,
    barcode,
    supplier_name,
    authors,
    publisher,
    published_year,
    language,
    weight_gram,
    dimensions,
    page_count,
    cover_type,
  } = bookData;

  // 1️⃣ Insert books
  const [result] = await pool.query(
    `INSERT INTO books
    (name, category_id, subcategory_id, price, discount, description)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      name,
      category_id,
      subcategory_id,
      price,
      cleanDiscount(discount),
      description,
    ]
  );

  const bookId = result.insertId;

  // 2️⃣ Insert book details an toàn
  await pool.query(
    `INSERT INTO book_details
      (book_id, barcode, supplier_name, authors, publisher, published_year, language, weight_gram, dimensions, page_count, cover_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookId,
      barcode || null,
      supplier_name || null,
      authors || null,
      publisher || null,
      cleanInt(published_year),
      language || null,
      cleanInt(weight_gram),
      dimensions || null,
      cleanInt(page_count),
      cover_type || null,
    ]
  );

  // 3️⃣ Insert main image
  if (mainImage) {
    await pool.query(
      `INSERT INTO book_images (book_id, image_url, is_main)
       VALUES (?, ?, 1)`,
      [bookId, mainImage.filename]
    );
  }

  // 4️⃣ Insert sub images
  if (subImages.length > 0) {
    const values = subImages.map((img) => [bookId, img.filename, 0]);

    await pool.query(
      `INSERT INTO book_images (book_id, image_url, is_main)
       VALUES ?`,
      [values]
    );
  }

  return {
    bookId,
  };
};

// Cập nhật sách

const updateBook = async (id, updateData, mainImage, subImages, oldImages) => {
  const {
    name,
    category_id,
    subcategory_id,
    price,
    discount,
    description,
    barcode,
    supplier_name,
    authors,
    publisher,
    published_year,
    language,
    weight_gram,
    dimensions,
    page_count,
    cover_type,
  } = updateData;

  // 1️⃣ update books
  await pool.query(
    `UPDATE books 
     SET name=?, category_id=?, subcategory_id=?, price=?, discount=?, description=?
     WHERE id=?`,
    [
      name,
      category_id,
      subcategory_id,
      price,
      cleanDiscount(discount),
      ,
      description,
      id,
    ]
  );

  // 2️⃣ update book_details
  await pool.query(
    `UPDATE book_details
     SET barcode=?, supplier_name=?, authors=?, publisher=?, 
     published_year=?, language=?, weight_gram=?, dimensions=?, 
     page_count=?, cover_type=?
     WHERE book_id=?`,
    [
      barcode || null,
      supplier_name || null,
      authors || null,
      publisher || null,
      cleanInt(published_year),
      language || null,
      cleanInt(weight_gram),
      dimensions || null,
      cleanInt(page_count),
      cover_type || null,
      id,
    ]
  );

  // 3️⃣ xử lý main image
  if (mainImage) {
    const [oldMain] = await pool.query(
      `SELECT image_url FROM book_images WHERE book_id=? AND is_main=1`,
      [id]
    );

    if (oldMain.length) {
      const filePath = path.join("uploads", oldMain[0].image_url);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await pool.query(
        `DELETE FROM book_images WHERE book_id=? AND is_main=1`,
        [id]
      );
    }

    await pool.query(
      `INSERT INTO book_images (book_id,image_url,is_main)
       VALUES (?,?,1)`,
      [id, mainImage.filename]
    );
  }

  // 4️⃣ xử lý subImages

  const keepImageIds = oldImages ? JSON.parse(oldImages) : [];

  // lấy ảnh hiện tại trong DB
  const [dbImages] = await pool.query(
    `SELECT id,image_url FROM book_images 
   WHERE book_id=? AND is_main=0`,
    [id]
  );

  // xoá ảnh không còn giữ
  for (const img of dbImages) {
    if (!keepImageIds.includes(img.id)) {
      const filePath = path.join("uploads", img.image_url);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await pool.query(`DELETE FROM book_images WHERE id=?`, [img.id]);
    }
  }

  // thêm ảnh mới
  if (subImages && subImages.length > 0) {
    const values = subImages.map((file) => [id, file.filename, 0]);

    await pool.query(
      `INSERT INTO book_images (book_id,image_url,is_main)
     VALUES ?`,
      [values]
    );
  }

  return {
    message: "Update book success",
  };
};

// Xóa sách
const deleteBook = async (id) => {
  const book = await getBookById(id);
  if (!book) return null;

  await pool.query("UPDATE books SET is_hidden = 1 WHERE id = ?", [id]);

  return {
    message: "Delete book success",
  };
};

export default {
  getAllBooks,
  getAllBooksNoPaging,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
