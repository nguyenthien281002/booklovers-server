import subCategoryService from "../services/subCategoryService";

// Lấy tất cả
const getAllSubcategories = async (req, res) => {
  try {
    const data = await subCategoryService.getAllSubcategories();
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Tạo mới
const createSubcategory = async (req, res) => {
  try {
    const data = await subCategoryService.createSubcategory(req.body);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Cập nhật
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const data = await subCategoryService.updateSubcategory(id, name);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Xoá
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await subCategoryService.deleteSubcategory(id);

    return res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// EXPORT DEFAULT
export default {
  getAllSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
