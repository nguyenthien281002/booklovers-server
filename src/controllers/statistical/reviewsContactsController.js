import reviewsContactsService from "../../services/statistical/reviewsContactsService";

const getContactsOverview = async (req, res) => {
  try {
    const data = await reviewsContactsService.getContactsOverview();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const getReviewOverview = async (req, res) => {
  try {
    const data = await reviewsContactsService.getReviewOverview();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const getTopBooksMostReviews = async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const year = req.query.year ? parseInt(req.query.year) : null;

    const data = await reviewsContactsService.getTopBooksMostReviews(
      limit,
      year
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const getTopBooksHighestRating = async (req, res) => {
  try {
    const { limit, year } = req.query;

    const data = await reviewsContactsService.getTopBooksHighestRating(
      limit || 5,
      year || null
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const getTopBooksLowestRating = async (req, res) => {
  try {
    const { limit, year } = req.query;

    const data = await reviewsContactsService.getTopBooksLowestRating(
      limit || 5,
      year || null
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export default {
  getContactsOverview,
  getReviewOverview,
  getTopBooksMostReviews,
  getTopBooksHighestRating,
  getTopBooksLowestRating,
};
