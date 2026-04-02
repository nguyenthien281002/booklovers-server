import express from "express";
import homeController from "../controllers/homeController";
import bookController from "../controllers/bookController";
import userController from "../controllers/userController";
import blogController from "../controllers/blogController";
import contactController from "../controllers/contactController";
import authController from "../controllers/authController";
import upload from "../middleware/uploadMiddleware";
import authMiddleware from "../middleware/authMiddleware";
import cartController from "../controllers/cartController";
import promotionController from "../controllers/promotionController";
import orderController from "../controllers/orderController";
import categoryController from "../controllers/categoryController";
import vnpayController from "../controllers/vnpayController";
import statisticController from "../controllers/statisticController";
import supplierController from "../controllers/supplierController";
import importController from "../controllers/importController";
import subCategoryController from "../controllers/subCategoryController";
import systemController from "../controllers/systemController";
import reviewController from "../controllers/reviewController";
import orderStatisticalController from "../controllers/statistical/orderController";
import customerController from "../controllers/statistical/customerController";
import productsImportsController from "../controllers/statistical/productsImportsController";
import reviewsContactsController from "../controllers/statistical/reviewsContactsController";
import messageController from "../controllers/messageController";
import notificationController from "../controllers/notificationController";
import chatOptionController from "../controllers/chatOptionController";
import chatCategoryController from "../controllers/chatCategoryController";

const router = express.Router();

const initWebRoutes = (app) => {
  router.get("/", homeController.getHomePage);

  // BOOKS
  router.get("/api/books", bookController.getAllBooks);
  router.get("/api/books/all", bookController.getAllBooksNoPaging);
  router.get("/api/book/:id", bookController.getBookById);
  router.post(
    "/api/book",
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "subImages", maxCount: 99 },
    ]),
    bookController.createBook
  );
  router.put(
    "/api/book",
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "subImages", maxCount: 99 },
    ]),
    bookController.updateBook
  );
  router.delete("/api/book/:id", bookController.deleteBook);

  router.get("/api/users", userController.getAllUsers);
  router.get("/api/user/profile", authMiddleware, userController.getProfile);
  router.get("/api/user/:id", userController.getUserById);
  router.post("/api/user", upload.single("avatar"), userController.createUser);
  router.put("/api/user", upload.single("avatar"), userController.updateUser);
  router.post(
    "/api/users/import",
    upload.single("file"),
    userController.importUsers
  );
  router.delete("/user/:id", userController.deleteUser);
  router.put(
    "/api/user-profile",
    authMiddleware,
    upload.single("avatar"),
    userController.updateUserProfile
  );
  router.put(
    "/api/user/update-password",
    authMiddleware,
    userController.updatePassword
  );
  router.delete("/api/user/:id", userController.deleteUser);
  router.post("/api/user/loginuser", userController.loginUser);
  router.post("/api/user/google-login", authController.googleLogin);
  router.post(
    "/api/user/facebook-login",
    authController.facebookLoginController
  );
  router.post("/api/user/loginadmin", userController.loginAdmin);
  router.post(
    "/api/user/address",
    authMiddleware,
    userController.createAddress
  );
  router.put(
    "/api/user/address/up",
    authMiddleware,
    userController.updateAddress
  );
  router.put(
    "/api/user/address/set-default",
    authMiddleware,
    userController.setDefaultAddress
  );
  router.delete(
    "/api/user/address/:id",
    authMiddleware,
    userController.deleteAddress
  );

  // blogs
  router.get("/api/blogs", blogController.getAllBlogsPage);
  router.get("/api/blog/:id", blogController.getBlogById);
  router.post("/api/blog", upload.single("image"), blogController.createBlog);
  router.get("/api/blogs/featured", blogController.getFeaturedBlogs);
  router.put("/api/blog", upload.single("image"), blogController.updateBlog);
  router.delete("/api/blog/:id", blogController.deleteBlog);
  router.get("/api/blogs/for-client", blogController.getBlogsForClient);

  // contacts
  router.post("/api/contact", contactController.createContact);
  router.get("/api/contacts", contactController.getAllContacts);
  router.put("/api/contact/:id/status", contactController.updateContactStatus);

  // suppliers
  router.post("/api/suppliers", supplierController.createSupplier);
  router.get("/api/suppliers", supplierController.getAllSuppliers);
  router.put("/api/suppliers/:id", supplierController.updateSupplier);
  router.delete("/api/suppliers/:id", supplierController.deleteSupplier);
  router.get("/api/suppliers/all", supplierController.getAllSuppliersNoPaging);

  // imports
  router.post("/api/imports", importController.createImport);
  router.get("/api/imports", importController.getAllImports);
  router.get("/api/imports/:id", importController.getImportById);

  // categories
  router.get("/api/menu", categoryController.getCategoriesWithSub);
  router.post("/api/categories", categoryController.createCategory);
  router.put("/api/categories/:id", categoryController.updateCategory);
  router.delete("/api/categories/:id", categoryController.deleteCategory);

  // sub categories
  router.get("/api/subcategories", subCategoryController.getAllSubcategories);
  router.post("/api/subcategories", subCategoryController.createSubcategory);
  router.put("/api/subcategories/:id", subCategoryController.updateSubcategory);

  // setting system
  router.get("/api/settings-system", systemController.getSettings);
  router.put(
    "/api/settings-system",
    upload.single("logo"),
    systemController.updateSettings
  );

  router.delete(
    "/api/subcategories/:id",
    subCategoryController.deleteSubcategory
  );

  router.post("/forgot-password", authController.sendResetOTP);
  router.post("/verify-otp", authController.verifyOTP);
  router.post("/reset-password", authController.resetPassword);

  router.post(
    "/email-change/send-otp",
    authMiddleware,
    authController.sendCurrentEmailOTP
  );
  router.post(
    "/email-change/verify-otp",
    authMiddleware,
    authController.verifyCurrentEmailOTP
  );
  router.post(
    "/email-change/update",
    authMiddleware,
    authController.updateToNewEmail
  );

  router.post("/send-otp-phone", authController.sendOtpPhone);
  router.post("/verify-otp-phone", authController.verifyOtpPhone);

  router.get("/api/cart", authMiddleware, cartController.getCartByUser);
  router.post("/api/cart/add", authMiddleware, cartController.addItemToCart);
  router.put(
    "/api/cart/item/:itemId",
    authMiddleware,
    cartController.updateItemQuantity
  );
  router.delete(
    "/api/cart/item/:itemId",
    authMiddleware,
    cartController.removeItemFromCart
  );

  // promotions
  router.get("/api/promotions", promotionController.getAllPromotions);
  router.post("/api/promotion/apply", promotionController.applyPromotion);
  router.post("/api/promotion", promotionController.createPromotion);
  router.put("/api/promotion", promotionController.updatePromotion);
  router.delete("/api/promotion/:id", promotionController.deletePromotion);
  router.post(
    "/api/promotion/import",
    upload.single("file"),
    promotionController.importPromotions
  );

  // ===== REVIEW =====
  router.post(
    "/api/reviews",
    upload.array("review", 50),
    reviewController.createReview
  );
  router.delete(
    "/api/reviews/:id",
    authMiddleware,
    reviewController.deleteReview
  );
  router.get("/api/reviews", reviewController.getAllReviews);
  router.get("/api/reviews/book/:book_id", reviewController.getReviewsByBookId);
  router.put(
    "/api/reviews/:id/toggle-visibility",
    reviewController.adminToggleReviewVisibility
  );
  router.put("/api/reviews/:id/delete", reviewController.adminDeleteReview);

  // ===== ORDER =====
  router.post("/api/orders", authMiddleware, orderController.createOrder);
  router.get(
    "/api/orders/my-orders",
    authMiddleware,
    orderController.getUserOrders
  );
  router.get("/api/orders/:id", orderController.getOrderById);
  router.put(
    "/api/orders/:orderId/cancel",
    authMiddleware,
    orderController.cancelOrder
  );

  router.post("/api/vnpay/create_payment_url", vnpayController.createPayment);
  router.get("/api/vnpay/vnpay_return", vnpayController.vnpayReturn);

  router.get(
    "/api/profileAdmin",
    authMiddleware,
    userController.getProfileAdmin
  );
  router.get("/api/admin/statistics", statisticController.getStatistics);
  router.get(
    "/api/admin/statisticsheader",
    statisticController.getStatisticsHeader
  );

  router.get(
    "/api/admin/statistics/top-orders",
    statisticController.getTopOrders
  );
  router.get(
    "/api/admin/statistics/top-buyers",
    statisticController.getTopBuyersByMonthYear
  );

  router.get("/api/admin/orders/all", orderController.getAllOrders);
  router.put(
    "/api/admin/orders/update-status/:orderId",
    orderController.updateOrderStatus
  );

  // ------ Thống kê bán hàng ---------
  router.get(
    "/api/admin/statistics/revenue-overview",
    orderStatisticalController.getRevenueStats
  );
  router.get(
    "/api/admin/statistics/revenue-growth",
    orderStatisticalController.getRevenueGrowth
  );
  router.get(
    "/api/admin/statistics/order-status-overview",
    orderStatisticalController.getOrderStatusOverview
  );
  router.get(
    "/api/admin/statistics/revenue-by-category",
    orderStatisticalController.getRevenueByCategory
  );
  router.get(
    "/api/admin/statistics/revenue-of-the-day",
    orderStatisticalController.getTodayDashboard
  );
  router.get(
    "/api/admin/statistics/top-orders-by-year",
    orderStatisticalController.getTopOrdersByYear
  );

  // ---- thống kê khách hàng ----
  router.get(
    "/api/admin/statistics/customer-overview",
    customerController.getCustomerOverview
  );
  router.get(
    "/api/admin/statistics/customer-clv",
    customerController.getCustomerCLV
  );
  router.get(
    "/api/admin/statistics/top-customers-by-year",
    customerController.getTopCustomersByYear
  );
  router.get(
    "/api/admin/statistics/customer-by-hour",
    customerController.getCustomerPurchaseByHourInYear
  );

  // ---- thống kê sản phẩm và nhập hàng ----
  router.get(
    "/api/admin/statistics/products-overview",
    productsImportsController.getProductsOverview
  );
  router.get(
    "/api/admin/statistics/stock-warnings",
    productsImportsController.getStockWarnings
  );
  router.get(
    "/api/admin/statistics/import-overview",
    productsImportsController.getImportOverview
  );
  router.get(
    "/api/admin/statistics/best-worst-books",
    productsImportsController.getBestAndWorstSellingBooks
  );

  // ---- thống kê đánh giá và phản hồi
  router.get(
    "/api/admin/statistics/contact-overview",
    reviewsContactsController.getContactsOverview
  );
  router.get(
    "/api/admin/statistics/review-overview",
    reviewsContactsController.getReviewOverview
  );
  router.get(
    "/api/admin/statistics/top-books-reviews",
    reviewsContactsController.getTopBooksMostReviews
  );
  router.get(
    "/api/admin/statistics/top-books-rating",
    reviewsContactsController.getTopBooksHighestRating
  );
  router.get(
    "/api/admin/statistics/top-books-worst-rating",
    reviewsContactsController.getTopBooksLowestRating
  );

  // ----  tin nhắn -----
  // router.get("/messages", messageController.getUsersChat);
  router.get("/api/admin/chat-users", messageController.getUsersChat);
  router.get(
    "/api/admin/messages/:userId",
    messageController.getMessagesByUser
  );

  // --- thông báo ----
  router.get(
    "/api/admin/notifications/:user_id",
    notificationController.getNotifications
  );
  router.put(
    "/api/admin/notifications/read-all/:user_id",
    notificationController.markAllAsRead
  );
  router.delete(
    "/api/admin/notifications/:user_id",
    notificationController.deleteAllNotifications
  );

  // ---- chat options ----
  router.get("/api/admin/chat-options", chatOptionController.getOptions);
  router.get(
    "/api/admin/chat-options/answer/:id",
    chatOptionController.getAnswer
  );
  router.post("/api/admin/chat-options", chatOptionController.createOption);
  router.put("/api/admin/chat-options/:id", chatOptionController.updateOption);
  router.delete(
    "/api/admin/chat-options/:id",
    chatOptionController.deleteOption
  );
  router.get(
    "/api/admin/categories-with-options",
    chatOptionController.getCategoriesWithOptions
  );

  // --- chat category
  router.get(
    "/api/admin/chat-categories",
    chatCategoryController.getAllCategories
  );
  router.get(
    "/api/admin/chat-categories",
    chatCategoryController.getAllCategories
  );
  router.post(
    "/api/admin/chat-categories",
    chatCategoryController.createCategory
  );
  router.put(
    "/api/admin/chat-categories/:id",
    chatCategoryController.updateCategory
  );
  router.delete(
    "/api/admin/chat-categories/:id",
    chatCategoryController.deleteCategory
  );

  app.use("/", router);
};

export default initWebRoutes;
