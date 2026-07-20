const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsRoot = process.env.UPLOADS_ROOT || path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);

function makeStorage(subdir) {
  const dest = path.join(uploadsRoot, subdir);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "");
      const ts = Date.now();
      cb(null, `${base}-${ts}${ext}`);
    },
  });
}

const imageFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  cb(new Error("File harus berupa gambar"));
};

const uploadImage = multer({
  storage: makeStorage("images"),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadDocument = multer({
  storage: makeStorage("documents"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const IMAGE_UPLOAD_FIELDS = ["photo", "image", "imageUrl", "photoUrl"];
const DOCUMENT_UPLOAD_FIELDS = ["file", "filePath", "document", "documentFile"];

function useFirstUploadedFile(fieldNames = []) {
  return (req, res, next) => {
    if (req.file) return next();

    if (!req.files) return next();

    if (Array.isArray(req.files)) {
      for (const fieldName of fieldNames) {
        const candidate = req.files.find((f) => f.fieldname === fieldName);
        if (candidate) {
          req.file = candidate;
          break;
        }
      }
      return next();
    }

    if (typeof req.files === "object") {
      for (const fieldName of fieldNames) {
        const candidate = req.files[fieldName]?.[0];
        if (candidate) {
          req.file = candidate;
          break;
        }
      }
    }

    return next();
  };
}

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        status: 400,
        message: `Field '${err.field}' tidak diharapkan. Untuk dokumen gunakan field 'file' atau 'filePath', untuk gambar gunakan field 'photo', 'image', atau 'imageUrl'`,
        success: false,
      });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: 400,
        message: "Ukuran file terlalu besar",
        success: false,
      });
    }
    return res.status(400).json({
      status: 400,
      message: `Error upload: ${err.message}`,
      success: false,
    });
  }
  if (err) {
    return res.status(400).json({
      status: 400,
      message: err.message || "Error saat mengunggah file",
      success: false,
    });
  }
  next();
}

module.exports = {
  uploadImage,
  uploadDocument,
  handleMulterError,
  useFirstUploadedFile,
  IMAGE_UPLOAD_FIELDS,
  DOCUMENT_UPLOAD_FIELDS,
};
