import contactSercive from "../services/contactSercive";

const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const id = await contactSercive.createContact({
      name,
      email,
      phone,
      message,
    });

    res.status(201).json({
      message: "Gửi liên hệ thành công",
    });
  } catch (err) {
    console.error("Lỗi khi tạo liên hệ:", err);
    res.status(500).json({ message: "Lỗi server khi gửi liên hệ" });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await contactSercive.getAllContacts(page, limit);

    res.status(200).json({
      status: "OK",
      data: result.contacts,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách liên hệ:", err);
    res.status(500).json({ message: "Lỗi server khi lấy liên hệ" });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ["pending", "in_progress", "resolved"];

    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const updated = await contactSercive.updateContactStatus(id, status);

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy contact" });
    }

    res.status(200).json({
      message: "Cập nhật trạng thái thành công",
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export default {
  createContact,
  getAllContacts,
  updateContactStatus,
};
