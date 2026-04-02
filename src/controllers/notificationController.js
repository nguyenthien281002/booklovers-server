import notificationService from "../services/notificationService";

const getNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;

    const data = await notificationService.getNotifications(user_id);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json("Lỗi server");
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { user_id } = req.params;

    await notificationService.markAllAsRead(user_id);

    res.json({ message: "Đã đọc tất cả" });
  } catch (error) {
    res.status(500).json("Lỗi server");
  }
};

export default {
  getNotifications,
  markAllAsRead,
};
