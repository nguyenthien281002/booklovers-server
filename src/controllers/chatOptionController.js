import chatOptionService from "../services/chatOptionService.js";

// GET LIST
const getOptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await chatOptionService.getAllOptions(page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ANSWER
const getAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await chatOptionService.getAnswerById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CREATE
const createOption = async (req, res) => {
  try {
    const { question, answer, category_id } = req.body;

    if (!question || !answer || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu",
      });
    }

    const data = await chatOptionService.createOption({
      question,
      answer,
      category_id,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE
const updateOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category_id } = req.body;

    const data = await chatOptionService.updateOption(id, {
      question,
      answer,
      category_id,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE (soft)
const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    await chatOptionService.deleteOption(id);

    res.json({
      success: true,
      message: "Đã xoá",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getCategoriesWithOptions = async (req, res) => {
  try {
    const data = await chatOptionService.getCategoriesWithOptions();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default {
  getOptions,
  getAnswer,
  createOption,
  updateOption,
  deleteOption,
  getCategoriesWithOptions,
};
