import pool from "../config/connectDB.js";

const getCartByUser = async (userId) => {
  const [cartRows] = await pool.query("SELECT * FROM carts WHERE user_id = ?", [
    userId,
  ]);
  let cart = cartRows[0];

  if (!cart) {
    const [result] = await pool.query(
      "INSERT INTO carts (user_id) VALUES (?)",
      [userId]
    );
    const [newCartRows] = await pool.query("SELECT * FROM carts WHERE id = ?", [
      result.insertId,
    ]);
    cart = newCartRows[0];
  }

  const [items] = await pool.query(
    `
    SELECT 
      ci.id AS cart_item_id,
      ci.quantity,
      b.id AS book_id,
      b.name,
      b.price,
      b.discount,
      b.quantity AS stock,   -- ✅ thêm dòng này
      b.sold,                -- ✅ thêm dòng này
      bi.image_url AS image
    FROM cart_items ci
    JOIN books b ON ci.book_id = b.id
    LEFT JOIN book_images bi 
      ON b.id = bi.book_id AND bi.is_main = 1
    WHERE ci.cart_id = ?
    ORDER BY ci.created_at DESC
    `,
    [cart.id]
  );

  delete cart.user_id;

  return { cart, items };
};

const addItemToCart = async (userId, bookId, quantity) => {
  const [cartRows] = await pool.query("SELECT * FROM carts WHERE user_id = ?", [
    userId,
  ]);
  let cart = cartRows[0];

  if (!cart) {
    const [result] = await pool.query(
      "INSERT INTO carts (user_id) VALUES (?)",
      [userId]
    );
    cart = { id: result.insertId };
  }

  const [existing] = await pool.query(
    "SELECT * FROM cart_items WHERE cart_id = ? AND book_id = ?",
    [cart.id, bookId]
  );

  if (existing.length > 0) {
    await pool.query(
      "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
      [quantity, existing[0].id]
    );
  } else {
    await pool.query(
      "INSERT INTO cart_items (cart_id, book_id, quantity) VALUES (?, ?, ?)",
      [cart.id, bookId, quantity]
    );
  }
};

const updateItemQuantity = async (itemId, quantity) => {
  await pool.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [
    quantity,
    itemId,
  ]);
};

const removeItemFromCart = async (itemId) => {
  await pool.query("DELETE FROM cart_items WHERE id = ?", [itemId]);
};

const clearCartByUser = async (userId, bookIds) => {
  if (!bookIds || bookIds.length === 0) return;

  const [cartRows] = await pool.query(
    "SELECT id FROM carts WHERE user_id = ?",
    [userId]
  );
  if (cartRows.length === 0) return;

  const cartId = cartRows[0].id;

  await pool.query(
    `DELETE FROM cart_items 
     WHERE cart_id = ? 
     AND book_id IN (?)`,
    [cartId, bookIds]
  );
};

export default {
  getCartByUser,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCartByUser,
};
