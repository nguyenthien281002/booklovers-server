import customerService from "../../services/statistical/customerService";

const getCustomerOverview = async (req, res) => {
  try {
    const data = await customerService.getCustomerOverview();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("❌ getCustomerOverview error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getCustomerCLV = async (req, res) => {
  try {
    const data = await customerService.getCustomerCLV();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("❌ getCustomerCLV error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getTopCustomersByYear = async (req, res) => {
  try {
    const { year, limit = 5 } = req.query;

    const data = await customerService.getTopCustomersByYear(
      year || new Date().getFullYear(),
      limit
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getTopCustomersByYear error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getCustomerPurchaseByHourInYear = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const data = await customerService.getCustomerPurchaseByHourInYear(year);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("getCustomerPurchaseByHourInYear error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default {
  getCustomerOverview,
  getCustomerCLV,
  getTopCustomersByYear,
  getCustomerPurchaseByHourInYear,
};
