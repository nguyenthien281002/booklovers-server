import blogService from "../services/blogService.js";

const getAllBlogsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const is_featured =
      req.query.is_featured !== undefined
        ? parseInt(req.query.is_featured)
        : undefined;

    const search = req.query.search || "";
    const status = req.query.status || ""; // DRAFT, PUBLISHED, ARCHIVED

    const result = await blogService.getAllBlogsPage(
      limit,
      offset,
      is_featured,
      search,
      status
    );

    res.status(200).json({
      status: "OK",
      data: result.blogs,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting blogs:", err);
    res.status(500).json({
      status: "ERROR",
      message: "Lỗi khi lấy blog",
    });
  }
};

const getBlogsForClient = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await blogService.getAllBlogsForClientPage(page, limit);

    return res.status(200).json({
      status: "OK",
      message: "Fetched blogs successfully",
      data: result.blogs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch blogs",
    });
  }
};

const getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await blogService.getFeaturedBlogs();
    res.status(200).json({
      status: "OK",
      data: blogs,
    });
  } catch (error) {
    console.error("Lỗi khi lấy blog nổi bật:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await blogService.getBlogById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Không tìm thấy blog" });
    }

    res.status(200).json({
      status: "OK",
      data: blog,
    });
  } catch (err) {
    console.error("Error getting blog by ID:", err);
    res.status(500).json({ message: "Lỗi server khi lấy blog" });
  }
};

const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      is_featured,
      description,
      date,
      is_hidden,
    } = req.body;
    const image = req.file ? req.file.filename : null;

    const newBlog = await blogService.createBlog({
      title,
      content,
      author,
      image,
      date,
      is_featured,
      description,
      is_hidden,
    });

    res.status(201).json({ message: "Tạo blog thành công", data: newBlog });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ message: "Lỗi khi tạo blog" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      description,
      is_featured,
      date,
      id,
      is_hidden,
    } = req.body;

    let image = null;

    if (req.file) {
      image = req.file.filename;
    }

    const updated = await blogService.updateBlog({
      id,
      title,
      content,
      author,
      date,
      image,
      is_featured,
      description,
      is_hidden,
    });

    res.status(200).json({ message: "Cập nhật thành công", data: updated });
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật blog" });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const deleted = await blogService.deleteBlog(blogId);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy blog để xóa" });
    }

    res.status(200).json({ message: "Xóa blog thành công", data: deleted });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Lỗi khi xóa blog" });
  }
};

export default {
  getAllBlogsPage,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  getBlogsForClient,
};
