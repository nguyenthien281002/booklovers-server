import orderService from "../services/orderService";
import sendMail from "../helpers/send.mail";
import userService from "../services/userService";

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;

    const { orderId, orderCode } = await orderService.createOrder(
      userId,
      orderData
    );

    // const user = await userService.getUserById(userId);
    // const { email, fullname } = user;
    // await sendMail(
    //   email,
    //   "Đặt hàng thành công - BookLovers ❤️",
    //   `
    //     <h2>Xin chào ${fullname},</h2>
    //     <p>Bạn đã đặt hàng thành công tại <strong>BookLovers</strong>.</p>
    //     <p><strong>Mã đơn hàng:</strong> ${orderCode}</p>
    //     <p>Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>
    //     <p style="margin-top:20px;">-- BookLovers Team ❤️</p>
    //   `
    // );
    res.status(201).json({
      message: "Đặt hàng thành công",
      orderId,
      orderCode,
    });
  } catch (error) {
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(500).json({ message: "Tạo đơn hàng thất bại" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderService.getOrdersByUser(userId);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  try {
    const success = await orderService.cancelOrder(orderId, userId);
    if (!success) {
      return res.status(403).json({ message: "Không thể huỷ đơn hàng này." });
    }

    res.json({ message: "Huỷ đơn hàng thành công." });
  } catch (error) {
    console.error("Lỗi huỷ đơn:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      paymentMethod = "",
      status = "",
      priceFilter = "",
      fromDate = "",
      toDate = "",
    } = req.query;

    const pageNum = +page;
    const limitNum = +limit;

    const result = await orderService.getAllOrders({
      page: pageNum,
      limit: limitNum,
      search,
      paymentMethod,
      status,
      priceFilter,
      fromDate,
      toDate,
    });

    return res.status(200).json({
      errCode: 0,
      message: "Success",
      data: result.orders,
      pagination: {
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    await orderService.updateOrderStatus(orderId, status);
    res.status(200).json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Lỗi máy chủ" });
  }
};

export default {
  createOrder,
  getUserOrders,
  cancelOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
