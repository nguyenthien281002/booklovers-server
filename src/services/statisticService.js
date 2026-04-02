import pool from "../config/connectDB.js";

const getStatistics = async (startDate, endDate) => {
  let whereClause = `order_date >= NOW() - INTERVAL 7 DAY`;
  let userWhereClause = `created_at >= NOW() - INTERVAL 7 DAY`;

  if (startDate && endDate) {
    whereClause = `order_date BETWEEN ? AND ?`;
    userWhereClause = `created_at BETWEEN ? AND ?`;
  }

  const [userCountRows] = await pool.query(
    `SELECT COUNT(*) AS totalUsers FROM users WHERE ${userWhereClause}`,
    startDate && endDate ? [startDate, endDate] : []
  );

  const [orderCountRows] = await pool.query(
    `SELECT COUNT(*) AS totalOrders FROM orders WHERE status = 'delivered' AND ${whereClause}`,
    startDate && endDate ? [startDate, endDate] : []
  );

  const [revenueRows] = await pool.query(
    `SELECT SUM(total_price) AS revenue FROM orders WHERE status = 'delivered' AND ${whereClause}`,
    startDate && endDate ? [startDate, endDate] : []
  );

  const [productCountRows] = await pool.query(
    `SELECT COUNT(*) AS totalProducts FROM books`
  );

  const [topBuyerRows] = await pool.query(
    `SELECT u.id, u.fullname, u.avatar, u.email, COUNT(o.id) AS orderCount, SUM(o.total_price) AS totalSpent
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.status = 'delivered' AND ${whereClause}
     GROUP BY u.id
     ORDER BY totalSpent DESC`,
    startDate && endDate ? [startDate, endDate] : []
  );

  const [topOrderRows] = await pool.query(
    `SELECT o.id, u.fullname, o.total_price, o.order_date, o.payment_method, o.location, o.order_code
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.status = 'delivered' AND ${whereClause}
     ORDER BY o.total_price DESC`,
    startDate && endDate ? [startDate, endDate] : []
  );

  const [monthlyRevenueRows] = await pool.query(`
    SELECT MONTH(order_date) AS month, SUM(total_price) AS total
    FROM orders
    WHERE status = 'delivered' AND YEAR(order_date) = YEAR(CURDATE())
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date)
  `);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = monthNames.map((month, index) => {
    const found = monthlyRevenueRows.find((row) => row.month === index + 1);
    return { month, value: found ? found.total : 0 };
  });

  return {
    totalUsers: userCountRows[0].totalUsers,
    totalOrders: orderCountRows[0].totalOrders,
    totalRevenue: revenueRows[0].revenue || 0,
    totalProducts: productCountRows[0].totalProducts,
    topBuyer: topBuyerRows || [],
    topOrder: topOrderRows || [],
    chartData,
  };
};

const calcPercentChange = (current, previous) => {
  current = Number(current) || 0;
  previous = Number(previous) || 0;

  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return (((current - previous) / previous) * 100).toFixed(0);
};

export const getStatisticsHeader = async () => {
  const now = new Date();

  function getUTCDate(
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    ms = 0
  ) {
    return new Date(Date.UTC(year, month, day, hour, minute, second, ms));
  }

  const startOfThisMonth = getUTCDate(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1
  );
  const endOfThisMonth = getUTCDate(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1
  );

  const startOfLastMonth = getUTCDate(
    now.getUTCFullYear(),
    now.getUTCMonth() - 1,
    1
  );
  const endOfLastMonth = getUTCDate(now.getUTCFullYear(), now.getUTCMonth(), 1);

  const [[{ totalUsers }]] = await pool.query(
    `SELECT COUNT(*) AS totalUsers FROM users WHERE created_at >= ? AND created_at <= ?`,
    [startOfThisMonth, endOfThisMonth]
  );

  const [[{ totalOrders }]] = await pool.query(
    `SELECT COUNT(*) AS totalOrders FROM orders WHERE status = 'delivered' AND order_date >= ? AND order_date <= ?`,
    [startOfThisMonth, endOfThisMonth]
  );

  const [[{ revenue }]] = await pool.query(
    `SELECT SUM(total_price) AS revenue FROM orders WHERE status = 'delivered' AND order_date >= ? AND order_date <= ?`,
    [startOfThisMonth, endOfThisMonth]
  );

  const [[{ totalProducts }]] = await pool.query(
    `SELECT COUNT(*) AS totalProducts FROM books`
  );

  const [[{ totalUsersLast }]] = await pool.query(
    `SELECT COUNT(*) AS totalUsersLast FROM users WHERE created_at >= ? AND created_at <= ?`,
    [startOfLastMonth, endOfLastMonth]
  );

  const [[{ totalOrdersLast }]] = await pool.query(
    `SELECT COUNT(*) AS totalOrdersLast FROM orders WHERE status = 'delivered' AND order_date >= ? AND order_date <= ?`,
    [startOfLastMonth, endOfLastMonth]
  );

  const [[{ revenueLast }]] = await pool.query(
    `SELECT SUM(total_price) AS revenueLast FROM orders WHERE status = 'delivered' AND order_date >= ? AND order_date <= ?`,
    [startOfLastMonth, endOfLastMonth]
  );

  return {
    totalUsers,
    totalUsersChange: calcPercentChange(totalUsers, totalUsersLast),
    totalOrders,
    totalOrdersChange: calcPercentChange(totalOrders, totalOrdersLast),
    revenue: revenue || 0,
    revenueChange: calcPercentChange(revenue || 0, revenueLast || 0),
    totalProducts,
  };
};

const getMonthlyRevenue = async (year) => {
  const [monthlyRevenueRows] = await pool.query(
    `
    SELECT MONTH(order_date) AS month, SUM(total_price) AS total
    FROM orders
    WHERE status = 'delivered' AND YEAR(order_date) = ?
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date)
    `,
    [year]
  );
  if (monthlyRevenueRows.length === 0) {
    return [];
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = monthNames.map((month, index) => {
    const found = monthlyRevenueRows.find((row) => row.month === index + 1);
    return { name: month, value: found ? Number(found.total) : 0 };
  });

  return chartData;
};

const getTopOrders = async (startDate, endDate, sortType = "top") => {
  let whereClause = "o.status = 'delivered'";
  const params = [];

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    whereClause += " AND o.order_date >= ? AND o.order_date <= ?";
    params.push(start, end);
  }

  let orderByClause = "";
  if (sortType === "top") {
    orderByClause = "o.total_price DESC";
  } else if (sortType === "latest") {
    orderByClause = "o.order_date DESC";
  }

  const [topOrderRows] = await pool.query(
    `
    SELECT o.id, u.fullname, o.total_price, o.order_date, o.payment_method, o.location, o.order_code
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    `,
    params
  );

  return topOrderRows;
};

const getTopBuyersByMonthYear = async (month, year) => {
  const whereClause = `MONTH(o.order_date) = ? AND YEAR(o.order_date) = ?`;

  const [topBuyerRows] = await pool.query(
    `
    SELECT 
      u.id, 
      u.fullname, 
      u.avatar, 
      u.email, 
      COUNT(o.id) AS orderCount, 
      SUM(o.total_price) AS totalSpent
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.status = 'delivered' AND ${whereClause}
    GROUP BY u.id
    ORDER BY totalSpent DESC
    `,
    [month, year]
  );

  return topBuyerRows;
};

const getOrderStatusByMonth = async (year) => {
  const [rows] = await pool.query(
    `
    SELECT 
      MONTH(order_date) AS month,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN status = 'shipping' THEN 1 ELSE 0 END) AS shipping,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
      SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned
    FROM orders
    WHERE YEAR(order_date) = ?
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date)
    `,
    [year]
  );

  return rows.map((row) => ({
    ...row,
    month: `Tháng ${row.month}`,
  }));
};

module.exports = {
  getStatistics,
  getStatisticsHeader,
  getMonthlyRevenue,
  getTopOrders,
  getTopBuyersByMonthYear,
  getOrderStatusByMonth,
};
