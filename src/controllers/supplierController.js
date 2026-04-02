import supplierService from "../services/supplierService.js";

const createSupplier = async (req, res) => {
  try {
    const { email } = req.body;

    const isExist = await supplierService.checkEmailExists(email);

    if (isExist) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    const id = await supplierService.createSupplier(req.body);

    res.status(201).json({
      message: "Tạo nhà cung cấp thành công",
      id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await supplierService.getAllSuppliers(page, limit);

    res.status(200).json({
      status: "OK",
      ...result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllSuppliersNoPaging = async (req, res) => {
  try {
    const data = await supplierService.getAllSuppliersNoPaging();

    res.status(200).json({
      status: "OK",
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await supplierService.updateSupplier(id, req.body);

    if (affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
    }

    res.status(200).json({
      message: "Cập nhật thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await supplierService.deleteSupplier(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
    }

    res.status(200).json({
      message: "Xoá thành công (đã ẩn)",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export default {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  getAllSuppliersNoPaging,
};
