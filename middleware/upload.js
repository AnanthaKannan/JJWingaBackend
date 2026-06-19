const multer = require("multer");

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only image and PDF files are allowed"));
    }

    return cb(null, true);
  },
});

const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next();
  });
};

module.exports = {
  upload,
  uploadSingleFile,
};
