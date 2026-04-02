import productsImportsService from "../../services/statistical/productsImportsService";

const getProductsOverview = async (req, res) => {
  try {
    const data = await productsImportsService.getProductsOverview();

    return res.status(200).json({
      success: true,
      message: "Get products overview success",
      data,
    });
  } catch (error) {
    console.error("productsOverview error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getStockWarnings = async (req, res) => {
  try {
    const data = await productsImportsService.getStockWarnings();

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

const getImportOverview = async (req, res) => {
  try {
    const data = await productsImportsService.getImportOverview();

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

const getBestAndWorstSellingBooks = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const data = await productsImportsService.getBestAndWorstSellingBooks(year);

    return res.status(200).json({
      success: true,
      year,
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
  getProductsOverview,
  getStockWarnings,
  getImportOverview,
  getBestAndWorstSellingBooks,
};
