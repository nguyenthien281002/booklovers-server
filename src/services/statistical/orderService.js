import pool from "../../config/connectDB.js";

const formatDate = (date) => date.toISOString().split("T")[0];

const formatVN = (date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;

const formatMonthYear = (date) =>
  `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

const calcGrowth = (current, previous) => {
  if (!previous) return 100;
  return (((current - previous) / previous) * 100).toFixed(1);
};

const getRevenueStats = async () => {
  const now = new Date();

  // ===== DAY =====
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // ===== WEEK =====
  const dayOfWeek = now.getDay() || 7;

  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const prevStart = new Date(start);
  prevStart.setDate(start.getDate() - 7);

  const prevEnd = new Date(end);
  prevEnd.setDate(end.getDate() - 7);

  // ===== MONTH =====
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const prevMonthDate = new Date(year, month - 2, 1);

  // ===== QUARTER =====
  const quarter = Math.floor((month - 1) / 3) + 1;
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;

  // ===== QUERY =====
  const [quarterCurrent] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE MONTH(order_date) BETWEEN ? AND ? 
     AND YEAR(order_date)=? 
     AND status='delivered'`,
    [startMonth, endMonth, year]
  );

  const prevQuarter = quarter === 1 ? 4 : quarter - 1;
  const prevYear = quarter === 1 ? year - 1 : year;

  const prevStartMonth = (prevQuarter - 1) * 3 + 1;
  const prevEndMonth = prevStartMonth + 2;

  const [quarterPrev] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
   WHERE MONTH(order_date) BETWEEN ? AND ? 
   AND YEAR(order_date)=? 
   AND status='delivered'`,
    [prevStartMonth, prevEndMonth, prevYear]
  );

  const [weekCurrent] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE DATE(order_date) BETWEEN ? AND ? AND status='delivered'`,
    [formatDate(start), formatDate(end)]
  );

  const [weekPrev] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE DATE(order_date) BETWEEN ? AND ? AND status='delivered'`,
    [formatDate(prevStart), formatDate(prevEnd)]
  );

  const [monthCurrent] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE MONTH(order_date)=? AND YEAR(order_date)=? AND status='delivered'`,
    [month, year]
  );

  const [monthPrev] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE MONTH(order_date)=? AND YEAR(order_date)=? AND status='delivered'`,
    [prevMonthDate.getMonth() + 1, prevMonthDate.getFullYear()]
  );

  const [yearCurrent] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE YEAR(order_date)=? AND status='delivered'`,
    [year]
  );

  const [yearPrev] = await pool.query(
    `SELECT SUM(total_price) as revenue FROM orders 
     WHERE YEAR(order_date)=? AND status='delivered'`,
    [year - 1]
  );

  // ===== RETURN =====
  return {
    quarter: {
      label: `Q${quarter}/${year}`,
      current: quarterCurrent[0].revenue || 0,
      previous: quarterPrev[0].revenue || 0,
      growth: calcGrowth(
        quarterCurrent[0].revenue || 0,
        quarterPrev[0].revenue || 0
      ),
    },

    week: {
      label: `${formatVN(start)} - ${formatVN(end)}`, // 👉 23/03 - 29/03
      current: weekCurrent[0].revenue || 0,
      previous: weekPrev[0].revenue || 0,
      growth: calcGrowth(weekCurrent[0].revenue || 0, weekPrev[0].revenue || 0),
    },

    month: {
      label: formatMonthYear(now), // 👉 03/2026
      current: monthCurrent[0].revenue || 0,
      previous: monthPrev[0].revenue || 0,
      growth: calcGrowth(
        monthCurrent[0].revenue || 0,
        monthPrev[0].revenue || 0
      ),
    },

    year: {
      label: `${year}`,
      current: yearCurrent[0].revenue || 0,
      previous: yearPrev[0].revenue || 0,
      growth: calcGrowth(yearCurrent[0].revenue || 0, yearPrev[0].revenue || 0),
    },
  };
};

const getRevenueGrowth = async (year) => {
  const [monthlyRevenueRows] = await pool.query(
    `
    SELECT 
      MONTH(order_date) AS month, 
      SUM(total_price) AS total
    FROM orders
    WHERE status = 'delivered' 
      AND YEAR(order_date) = ?
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date)
    `,
    [year]
  );

  if (monthlyRevenueRows.length === 0) {
    return [];
  }

  const chartData = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    const found = monthlyRevenueRows.find((row) => row.month === month);

    return {
      month,
      value: found ? Number(found.total) : 0,
    };
  });

  return chartData;
};

const getOrderStatusOverview = async (year) => {
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

  const monthly = rows.map((row) => ({
    ...row,
    month: `${row.month}`,
  }));

  const total = monthly.reduce(
    (acc, item) => {
      acc.pending += Number(item.pending || 0);
      acc.confirmed += Number(item.confirmed || 0);
      acc.shipping += Number(item.shipping || 0);
      acc.delivered += Number(item.delivered || 0);
      acc.cancelled += Number(item.cancelled || 0);
      acc.returned += Number(item.returned || 0);
      return acc;
    },
    {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    }
  );

  return {
    monthly,
    total,
  };
};

const getRevenueByCategory = async (year) => {
  const query = `
        SELECT 
        c.id AS category_id,
        c.name AS category_name,
        MONTH(o.order_date) AS month,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
        COALESCE(SUM(oi.quantity), 0) AS total_sold,
        COUNT(DISTINCT o.id) AS total_orders

        FROM categories c
        LEFT JOIN books b 
        ON b.category_id = c.id

        LEFT JOIN order_items oi 
        ON oi.book_id = b.id

        LEFT JOIN orders o 
        ON oi.order_id = o.id 
        AND o.status = 'delivered'
        AND YEAR(o.order_date) = ?

        WHERE c.is_hidden = 0

        GROUP BY c.id, c.name, MONTH(o.order_date)
        ORDER BY c.id, month;
    `;

  const [rows] = await pool.query(query, [year]);
  return rows;
};

const getRevenueByCategoryService = async (year) => {
  const rows = await getRevenueByCategory(year);

  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

  const map = {};

  for (const row of rows) {
    const id = row.category_id;

    if (!map[id]) {
      map[id] = {
        category_id: row.category_id,
        category_name: row.category_name,

        total_revenue: 0,
        total_sold: 0,
        total_orders: 0,

        months: MONTHS.map((m) => ({
          month: m,
          revenue: 0,
          total_sold: 0,
          total_orders: 0,
        })),
      };
    }

    // bỏ row null month (cái bạn đang bị rác dữ liệu)
    if (!row.month) continue;

    const idx = row.month - 1;

    map[id].months[idx] = {
      month: row.month,
      revenue: Number(row.revenue || 0),
      total_sold: Number(row.total_sold || 0),
      total_orders: Number(row.total_orders || 0),
    };

    // cộng tổng
    map[id].total_revenue += Number(row.revenue || 0);
    map[id].total_sold += Number(row.total_sold || 0);
    map[id].total_orders += Number(row.total_orders || 0);
  }

  return Object.values(map);
};

const getTodayDashboard = async () => {
  const today = new Date();
  const formatDate = today.toISOString().split("T")[0]; // yyyy-mm-dd
  const label = formatVN(today); //

  // ===== OVERVIEW =====
  const [overviewRows] = await pool.query(
    `
    SELECT 
      COALESCE(SUM(total_price),0) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE DATE(order_date) = ?
    AND status = 'delivered'
    `,
    [formatDate]
  );

  const [productRows] = await pool.query(
    `
    SELECT COALESCE(SUM(oi.quantity),0) as products
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE DATE(o.order_date) = ?
    AND o.status = 'delivered'
    `,
    [formatDate]
  );

  const revenue = overviewRows[0]?.revenue || 0;
  const orders = overviewRows[0]?.orders || 0;
  const products = productRows[0]?.products || 0;

  const aov = orders > 0 ? Math.round(revenue / orders) : 0;

  // ===== STATUS =====
  const [statusRows] = await pool.query(
    `
    SELECT 
      status,
      COUNT(*) as value
    FROM orders
    WHERE DATE(order_date) = ?
    GROUP BY status
    `,
    [formatDate]
  );

  const statusMap = {
    pending: "Đang chờ xử lý",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã huỷ",
    returned: "Đã trả hàng",
  };

  const statusData = Object.keys(statusMap).map((key) => {
    const found = statusRows.find((s) => s.status === key);

    return {
      name: statusMap[key],
      value: found ? found.value : 0,
    };
  });

  // ===== RETURN =====
  return {
    date: label,

    overview: {
      revenue,
      orders,
      products,
      aov,
    },

    status: statusData,
  };
};

const getTopOrdersByYear = async (year, limit = 5) => {
  const [rows] = await pool.query(
    `
    SELECT 
      o.id,
      o.total_price,
      o.order_date,
      o.location,
      o.payment_method,
      o.order_code,
      u.id AS user_id,
      u.fullname
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE YEAR(o.order_date) = ?
      AND o.status = 'delivered'
    ORDER BY o.total_price DESC
    LIMIT ?
    `,
    [year, Number(limit)]
  );

  return rows;
};

export default {
  getRevenueStats,
  getRevenueGrowth,
  getOrderStatusOverview,
  getRevenueByCategory,
  getRevenueByCategoryService,
  getTodayDashboard,
  getTopOrdersByYear,
};
