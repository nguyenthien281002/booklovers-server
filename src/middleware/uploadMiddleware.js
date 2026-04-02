import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "src/public/uploads";

    if (file.fieldname === "avatar") {
      folder = "src/public/avatar";
    }

    if (file.fieldname === "file") {
      folder = "src/public/fileImports";
    }

    if (file.fieldname === "image") {
      folder = "src/public/blogs";
    }

    if (file.fieldname === "logo") {
      folder = "src/public/logo";
    }

    if (file.fieldname === "review") {
      folder = "src/public/reviews";
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;
