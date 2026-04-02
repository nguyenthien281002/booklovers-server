import cartService from "../services/cartService.js";

const getCartByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartService.getCartByUser(userId);
    res.status(200).json(cart);
  } catch (err) {
    console.error("Error getting cart:", err);
    res.status(500).json({ message: "Lỗi server khi lấy giỏ hàng" });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, quantity } = req.body;
    await cartService.addItemToCart(userId, bookId, quantity);
    res.status(200).json({ message: "Đã thêm sản phẩm vào giỏ hàng" });
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).json({ message: "Lỗi server khi thêm sản phẩm vào giỏ" });
  }
};

const updateItemQuantity = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { quantity } = req.body;
    await cartService.updateItemQuantity(itemId, quantity);
    res.status(200).json({ message: "Cập nhật số lượng thành công" });
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật số lượng" });
  }
};

const removeItemFromCart = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    await cartService.removeItemFromCart(itemId);
    res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng" });
  } catch (err) {
    console.error("Error removing item:", err);
    res.status(500).json({ message: "Lỗi server khi xóa sản phẩm" });
  }
};

export default {
  getCartByUser,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
};
