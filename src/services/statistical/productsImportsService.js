import pool from "../../config/connectDB.js";

const getProductsOverview = async () => {
  const [rows] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM books WHERE is_hidden = 0) AS total_products,

      -- tổng số lượng sách đã bán
      (SELECT COALESCE(SUM(oi.quantity), 0)
       FROM order_items oi
       JOIN books b ON b.id = oi.book_id
       WHERE b.is_hidden = 0
      ) AS total_sold_quantity,

      -- số sách đã từng được bán
      (SELECT COUNT(DISTINCT oi.book_id)
       FROM order_items oi
       JOIN books b ON b.id = oi.book_id
       WHERE b.is_hidden = 0
      ) AS sold_books,

      -- số sách chưa từng được bán
      (
        (SELECT COUNT(*) FROM books WHERE is_hidden = 0)
        -
        (SELECT COUNT(DISTINCT oi.book_id)
         FROM order_items oi
         JOIN books b ON b.id = oi.book_id
         WHERE b.is_hidden = 0
        )
      ) AS unsold_books
  `);

  return rows[0];
};

const getStockWarnings = async () => {
  const [rows] = await pool.query(`
      SELECT 
        b.id,
        b.name,
        b.quantity,
        b.price
      FROM books b
      WHERE b.is_hidden = 0
    `);

  const summary = {
    in_stock: 0,
    low_stock: 0,
    critical_stock: 0,
    out_of_stock: 0,
  };

  rows.forEach((book) => {
    const quantity = Number(book.quantity || 0);

    if (quantity === 0) {
      summary.out_of_stock++;
    } else if (quantity <= 3) {
      summary.critical_stock++;
    } else if (quantity < 10) {
      summary.low_stock++;
    } else {
      summary.in_stock++;
    }
  });

  return summary;
};

const getImportOverview = async () => {
  const [[orders]] = await pool.query(`
      SELECT COUNT(*) AS total_import_details
      FROM imports
    `);

  const [[revenue]] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_import_revenue
      FROM imports
    `);

  const [[books]] = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) AS total_import_books
      FROM import_details
    `);

  const [[suppliers]] = await pool.query(`
      SELECT COUNT(*) AS total_suppliers 
      FROM suppliers WHERE is_hidden = 0
    `);

  return {
    total_import_details: orders.total_import_details,
    total_import_revenue: revenue.total_import_revenue,
    total_import_books: books.total_import_books,
    total_suppliers: suppliers.total_suppliers,
  };
};

const getBestAndWorstSellingBooks = async (year) => {
  const [rows] = await pool.query(
    `
      SELECT 
        b.id,
        b.name,
        b.price,
        COALESCE(SUM(oi.quantity), 0) AS sold_quantity
      FROM books b
      LEFT JOIN order_items oi 
        ON oi.book_id = b.id
      LEFT JOIN orders o
        ON o.id = oi.order_id
      WHERE b.is_hidden = 0
        AND YEAR(o.order_date) = ?
      GROUP BY b.id, b.name, b.price
      `,
    [year]
  );

  const sorted = rows.sort((a, b) => b.sold_quantity - a.sold_quantity);

  return {
    bestSelling: sorted.slice(0, 10),
    worstSelling: sorted
      .slice()
      .sort((a, b) => a.sold_quantity - b.sold_quantity)
      .slice(0, 10),
  };
};

export default {
  getProductsOverview,
  getStockWarnings,
  getImportOverview,
  getBestAndWorstSellingBooks,
};
