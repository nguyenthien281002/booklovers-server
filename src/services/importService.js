import pool from "../config/connectDB.js";

const createImport = async ({ supplier_id, items }) => {
  if (!supplier_id) throw new Error("Thiếu nhà cung cấp");
  if (!items || items.length === 0) throw new Error("Danh sách sản phẩm trống");

  // Tính tổng tiền
  let total_amount = 0;
  const parsedItems = items.map((item) => {
    const book_id = Number(item.book_id);
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!book_id || quantity <= 0 || price <= 0) {
      throw new Error("Dữ liệu sản phẩm không hợp lệ");
    }

    total_amount += quantity * price;
    return { book_id, quantity, price };
  });

  // 1. Insert import
  const [importResult] = await pool.query(
    `INSERT INTO imports (supplier_id, total_amount, created_at)
     VALUES (?, ?, NOW())`,
    [supplier_id, total_amount]
  );

  const importId = importResult.insertId;

  // 2. Insert import_details (batch)
  const values = parsedItems.map((item) => [
    importId,
    item.book_id,
    item.quantity,
    item.price,
  ]);

  await pool.query(
    `INSERT INTO import_details (import_id, book_id, quantity, price)
     VALUES ?`,
    [values]
  );

  // 3. Update stock
  for (const item of parsedItems) {
    await pool.query(`UPDATE books SET quantity = quantity + ? WHERE id = ?`, [
      item.quantity,
      item.book_id,
    ]);
  }

  return importId;
};

const getAllImports = async ({
  page = 1,
  limit = 10,
  supplierId,
  startDate,
  endDate,
}) => {
  const offset = (page - 1) * limit;
  let whereClause = "WHERE 1=1";
  const values = [];

  // ✅ lọc theo supplierId
  if (supplierId) {
    whereClause += " AND i.supplier_id = ?";
    values.push(supplierId);
  }

  // ✅ lọc theo ngày
  if (startDate) {
    whereClause += " AND DATE(i.created_at) >= ?";
    values.push(startDate);
  }
  if (endDate) {
    whereClause += " AND DATE(i.created_at) <= ?";
    values.push(endDate);
  }

  // 1️⃣ Lấy imports
  const [rows] = await pool.query(
    `SELECT 
        i.*,
        s.id as supplier_id,
        s.name as supplier_name
     FROM imports i
     LEFT JOIN suppliers s ON i.supplier_id = s.id
     ${whereClause}
     ORDER BY i.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  // 2️⃣ count
  const [totalRows] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM imports i
     LEFT JOIN suppliers s ON i.supplier_id = s.id
     ${whereClause}`,
    values
  );

  // 3️⃣ details
  const importIds = rows.map((r) => r.id);
  let details = [];

  if (importIds.length > 0) {
    const [detailRows] = await pool.query(
      `SELECT 
          d.import_id,
          d.book_id,
          d.quantity,
          d.price,
          b.name as book_name
       FROM import_details d
       LEFT JOIN books b ON d.book_id = b.id
       WHERE d.import_id IN (?)`,
      [importIds]
    );
    details = detailRows;
  }

  // 4️⃣ merge
  const imports = rows.map((row) => {
    const { supplier_id, supplier_name, ...rest } = row;

    const items = details
      .filter((d) => d.import_id === row.id)
      .map((d) => ({
        book_id: d.book_id,
        book_name: d.book_name,
        quantity: d.quantity,
        price: d.price,
      }));

    return {
      ...rest,
      supplier: supplier_id ? { id: supplier_id, name: supplier_name } : null,
      items,
    };
  });

  return {
    imports,
    total: totalRows[0].total,
  };
};

const getImportById = async (id) => {
  // 1. thông tin phiếu nhập
  const [importRows] = await pool.query(
    `SELECT i.*, s.name as supplier_name
       FROM imports i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.id = ?`,
    [id]
  );

  if (importRows.length === 0) return null;

  // 2. chi tiết nhập
  const [details] = await pool.query(
    `SELECT d.*, b.title as book_name
       FROM import_details d
       LEFT JOIN books b ON d.book_id = b.id
       WHERE d.import_id = ?`,
    [id]
  );

  return {
    import: importRows[0],
    details,
  };
};

export default {
  createImport,
  getAllImports,
  getImportById,
};
