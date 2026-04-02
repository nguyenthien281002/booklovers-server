import bookService from "../services/bookService.js";

const getAllBooks = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = "",
    search = "",
    prices = [],
    categoryId = null,
    subcategoryId = null,
  } = req.query;
  const offset = (page - 1) * limit;

  const priceRanges = Array.isArray(prices) ? prices : [prices];

  const result = await bookService.getAllBooks(
    limit,
    offset,
    sort,
    search,
    priceRanges,
    categoryId,
    subcategoryId
  );

  return res.status(200).json({
    status: "OK",
    message: "Fetched all books successfully",
    data: result.books,
    pagination: {
      total: result.total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(result.total / limit),
    },
  });
};

const getAllBooksNoPaging = async (req, res) => {
  try {
    const books = await bookService.getAllBooksNoPaging();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getBookById = async (req, res) => {
  const id = req.params.id;
  const data = await bookService.getBookById(id);

  if (!data) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json({
    status: "OK",
    message: "Fetched book details successfully",
    data,
  });
};

const createBook = async (req, res) => {
  try {
    const bookData = req.body;

    const mainImage = req.files["mainImage"]?.[0] || null;
    const subImages = req.files["subImages"] || [];

    const result = await bookService.createBook(bookData, mainImage, subImages);

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create book error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
const updateBook = async (req, res) => {
  try {
    const updateData = req.body;
    const id = updateData.id;

    const mainImage = req.files["mainImage"]?.[0] || null;
    const subImages = req.files["subImages"] || [];
    const oldImages = req.body.oldImages || "[]";

    const result = await bookService.updateBook(
      id,
      updateData,
      mainImage,
      subImages,
      oldImages
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Update book error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteBook = async (req, res) => {
  const id = req.params.id;
  const result = await bookService.deleteBook(id);
  return res.status(200).json(result);
};

export default {
  getAllBooks,
  getAllBooksNoPaging,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
