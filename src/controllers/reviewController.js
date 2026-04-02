import reviewService from "../services/reviewService.js";

const createReview = async (req, res) => {
  try {
    const files = req.files || [];

    const media = files.map((file) => ({
      url: `${file.filename}`,
      type: file.mimetype.startsWith("image") ? "image" : "video",
    }));

    const id = await reviewService.createReview({
      ...req.body,
      media,
    });

    res.json({ success: true, review_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// xoá review (client)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const result = await reviewService.deleteReview(id, currentUserId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// lấy tất cả review theo product
const getAllReviews = async (req, res) => {
  try {
    let { page = 1, limit = 10, rating, status, search } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filters = { rating, status, search };

    const result = await reviewService.getAllReviews(page, limit, filters);

    res.status(200).json({
      status: "OK",
      data: result.reviews,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// thêm media
const addMedia = async (req, res) => {
  try {
    const { review_id, media_url, media_type } = req.body;

    const id = await reviewService.addReviewMedia(
      review_id,
      media_url,
      media_type
    );

    res.json({ success: true, media_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// lấy tất cả media
const getAllMedia = async (req, res) => {
  try {
    const data = await reviewService.getAllMedia();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getReviewsByBookId = async (req, res) => {
  try {
    const { book_id } = req.params;
    const { rating } = req.query;
    const data = await reviewService.getReviewsByBookId(
      book_id,
      rating ? Number(rating) : null
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const adminToggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    await reviewService.toggleReviewVisibilityByAdmin(id);

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("adminToggleReviewVisibility error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Admin delete review (is_hidden = 1)
const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({ message: "Review ID chưa được cung cấp" });

    const affectedRows = await reviewService.deleteReviewByAdmin(id);

    return res.json({ success: true, message: "Đã xoá review thành công" });
  } catch (err) {
    console.error("adminDeleteReview error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createReview,
  deleteReview,
  getAllReviews,
  getReviewsByBookId,
  adminToggleReviewVisibility,
  adminDeleteReview,
};
