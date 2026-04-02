import categoryService from "../services/categoryService.js";

// GET all
const getCategoriesWithSub = async (req, res) => {
  try {
    const data = await categoryService.getCategoriesWithSub();
    res.status(200).json({
      status: "OK",
      message: "Lấy danh sách menu cha-con thành công",
      data,
    });
  } catch (error) {
    console.error("Lỗi khi lấy menu:", error);
    res.status(500).json({ message: "Lỗi server khi lấy menu" });
  }
};

// CREATE
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const data = await categoryService.createCategory(name);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const data = await categoryService.updateCategory(id, name);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE (soft delete)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await categoryService.deleteCategory(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export default {
  getCategoriesWithSub,
  createCategory,
  updateCategory,
  deleteCategory,
};
