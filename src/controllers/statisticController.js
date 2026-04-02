import statisticService from "../services/statisticService";

const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await statisticService.getStatistics(startDate, endDate);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    res.status(200).json(data);
  } catch (err) {
    console.error("Fetch statistics failed:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getStatisticsHeader = async (req, res) => {
  try {
    const stats = await statisticService.getStatisticsHeader();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Statistic Error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
  }
};

const getTopOrders = async (req, res) => {
  try {
    const { startDate, endDate, sortType = "top" } = req.query;

    const orders = await statisticService.getTopOrders(
      startDate,
      endDate,
      sortType
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    res.status(200).json({
      message: "Fetched top orders successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Error in getTopOrders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTopBuyersByMonthYear = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        status: 400,
        message: "Thiếu tháng hoặc năm",
      });
    }

    const buyers = await statisticService.getTopBuyersByMonthYear(month, year);

    return res.status(200).json({
      status: 200,
      message: "Lấy danh sách người mua thành công",
      data: buyers,
    });
  } catch (error) {
    console.error("Lỗi khi lấy top buyers:", error);
    return res.status(500).json({
      status: 500,
      message: "Lỗi server",
    });
  }
};

const getOrderStatusByMonth = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Thiếu năm" });
    }

    const data = await statisticService.getOrderStatusByMonth(year);
    res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi thống kê theo tháng:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export default {
  getStatistics,
  getStatisticsHeader,
  getTopOrders,
  getTopBuyersByMonthYear,
  getOrderStatusByMonth,
};
