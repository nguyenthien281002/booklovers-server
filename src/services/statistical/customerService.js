import pool from "../../config/connectDB.js";

const getCustomerOverview = async () => {
  // Tổng khách
  const [[totalCustomers]] = await pool.query(`
    SELECT COUNT(*) AS total FROM users WHERE is_hidden = 0
  `);

  //  Khách mới (30 ngày)
  const [[newCustomers]] = await pool.query(`
    SELECT COUNT(*) AS total 
    FROM users
    WHERE is_hidden = 0
    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  //  Khách quay lại (>= 2 đơn)
  const [[returningCustomers]] = await pool.query(`
    SELECT COUNT(*) AS total FROM (
      SELECT o.user_id
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE u.is_hidden = 0
      GROUP BY o.user_id
      HAVING COUNT(*) >= 2
    ) t
  `);

  //  AOV
  const [[aov]] = await pool.query(`
      SELECT 
      IFNULL(SUM(total_price) / COUNT(*), 0) AS value
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE u.is_hidden = 0
  `);

  return {
    totalCustomers: totalCustomers.total,
    newCustomers: newCustomers.total,
    returningCustomers: returningCustomers.total,
    aov: Math.round(aov.value || 0),
  };
};

const getCustomerCLV = async () => {
  //  CLV trung bình
  const [[avgCLV]] = await pool.query(`
      SELECT IFNULL(AVG(total_spent), 0) AS value
      FROM (
        SELECT o.user_id, SUM(o.total_price) AS total_spent
        FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE u.is_hidden = 0
        GROUP BY o.user_id
      ) t
    `);

  //  CLV cao nhất
  const [[maxCLV]] = await pool.query(`
      SELECT u.fullname, SUM(o.total_price) AS total_spent
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE u.is_hidden = 0
      GROUP BY o.user_id
      ORDER BY total_spent DESC
      LIMIT 1
    `);

  //  Top 2 đơn hàng lớn nhất
  const [topOrders] = await pool.query(`
      SELECT u.fullname, o.total_price
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE u.is_hidden = 0
      ORDER BY o.total_price DESC
      LIMIT 2
    `);

  return {
    avgCLV: Math.round(avgCLV.value || 0),

    maxCLV: maxCLV?.total_spent || 0,
    topCustomerName: maxCLV?.fullname || "",

    maxOrder: topOrders[0] || null,
    secondMaxOrder: topOrders[1] || null,
  };
};

const getTopCustomersByYear = async (year, limit = 5) => {
  const [rows] = await pool.query(
    `
      SELECT 
      u.id AS user_id,
      u.fullname,
    
      SUM(o.total_price) AS total_spent,
      COUNT(o.id) AS total_orders,
    
      MAX(o.order_date) AS last_order_date,
      MIN(o.order_date) AS first_order_date,
    
      ROUND(SUM(o.total_price) / COUNT(o.id), 0) AS avg_order_value,
    
      CASE 
        WHEN SUM(o.total_price) > 1000000 THEN 'VIP'
        WHEN SUM(o.total_price) > 500000 THEN 'LOYAL'
        ELSE 'NEW'
      END AS customer_type
    
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE YEAR(o.order_date) = ?
        AND o.status = 'delivered'
      GROUP BY u.id, u.fullname, u.email, u.phone
      ORDER BY total_spent DESC
      LIMIT ?
    `,
    [year, Number(limit)]
  );

  return rows;
};

const getCustomerPurchaseByHourInYear = async (year) => {
  const [rows] = await pool.query(
    `
    SELECT 
      HOUR(o.order_date) AS hour,
      COUNT(o.id) AS total_orders,
      SUM(o.total_price) AS total_revenue,
      COUNT(DISTINCT o.user_id) AS total_customers
    FROM orders o
    WHERE YEAR(o.order_date) = ?
      AND o.status = 'delivered'
    GROUP BY HOUR(o.order_date)
    ORDER BY hour ASC
    `,
    [year]
  );

  const result = Array.from({ length: 24 }, (_, i) => {
    const found = rows.find((r) => r.hour === i);
    return {
      hour: i,
      total_orders: found?.total_orders || 0,
      total_revenue: found?.total_revenue || 0,
      total_customers: found?.total_customers || 0,
    };
  });

  return result;
};

export default {
  getCustomerOverview,
  getCustomerCLV,
  getTopCustomersByYear,
  getCustomerPurchaseByHourInYear,
};
