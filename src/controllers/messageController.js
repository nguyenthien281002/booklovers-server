import messageService from "../services/messageService";

const getUsersChat = async (req, res) => {
  try {
    const data = await messageService.getChatUsers();
    res.json(data);
  } catch (error) {
    console.error("Error getUsersChat:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách user chat",
      error: error.message,
    });
  }
};

const getMessagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await messageService.getMessagesByUser(userId);
    res.json(data);
  } catch (error) {
    console.error("Error getMessagesByUser:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tin nhắn",
      error: error.message,
    });
  }
};

export default { getUsersChat, getMessagesByUser };
