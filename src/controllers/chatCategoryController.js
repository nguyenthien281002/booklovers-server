import chatCategoryService from "../services/chatCategoryService";

const getAllCategories = async (req, res) => {
  try {
    const data = await chatCategoryService.getAllCategories();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Thiếu name" });
    }

    const result = await chatCategoryService.createCategory(name);

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await chatCategoryService.updateCategory(id, name);

    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await chatCategoryService.deleteCategory(id);

    return res.json({ success: true, message: "Xoá thành công" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
