import promotionService from "../services/promotionService.js";

export const getAllPromotions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const discount_type = req.query.discount_type || "";
    const search = req.query.search || "";
    const status = req.query.status || "";

    const result = await promotionService.getAllPromotions(
      limit,
      offset,
      discount_type,
      search,
      status
    );

    res.status(200).json({
      status: "OK",
      data: result.promotions,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting promotions:", err);

    res.status(500).json({
      status: "ERROR",
      message: "Lỗi khi lấy danh sách khuyến mãi",
    });
  }
};

export const applyPromotion = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Vui lòng nhập mã khuyến mãi" });
  }

  try {
    const promo = await promotionService.getPromotionByCode(code);

    if (!promo) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return res
        .status(404)
        .json({ message: "Mã khuyến mãi không hợp lệ hoặc đã hết hạn" });
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    res.status(200).json({ promotion: promo });
  } catch (err) {
    console.error("Lỗi kiểm tra mã khuyến mãi:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi kiểm tra mã khuyến mãi" });
  }
};

export const createPromotion = async (req, res) => {
  try {
    const id = await promotionService.createPromotion(req.body);

    res.status(201).json({
      message: "Tạo mã khuyến mãi thành công",
      id,
    });
  } catch (err) {
    console.error("Create promotion error:", err);
    res.status(500).json({ message: "Lỗi tạo mã khuyến mãi" });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    await promotionService.updatePromotion(req.body);

    res.status(200).json({
      message: "Cập nhật mã khuyến mãi thành công",
    });
  } catch (err) {
    console.error("Update promotion error:", err);
    res.status(500).json({ message: "Lỗi cập nhật mã khuyến mãi" });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const id = req.params.id;

    await promotionService.deletePromotion(id);

    res.status(200).json({
      message: "Xóa mã khuyến mãi thành công",
    });
  } catch (err) {
    console.error("Delete promotion error:", err);
    res.status(500).json({ message: "Lỗi xóa mã khuyến mãi" });
  }
};

export const importPromotions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Vui lòng chọn file",
      });
    }

    const result = await promotionService.importPromotions(req.file.path);

    res.status(200).json({
      message: "Import khuyến mãi thành công",
      data: result,
    });
  } catch (error) {
    console.error("Import promotions error:", error);
    res.status(500).json({
      message: "Lỗi khi import khuyến mãi",
    });
  }
};

export default {
  getAllPromotions,
  applyPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  importPromotions,
};
