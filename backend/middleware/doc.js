const multer = require("multer");
const path = require("path");
const fs = require("fs");

class DocumentUpload {
  constructor() {
    this.uploadDir = path.join(__dirname, "../uploads");

    this.fileCategories = {
      images: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      documents: [".pdf", ".doc", ".docx", ".txt"],
      others: [".zip", ".rar", ".csv", ".xls", ".xlsx", ".ppt", ".pptx"],
    };

    this.allowedExtensions = Object.values(this.fileCategories).flat();

    this.sizeLimits = {
      images: 5,
      documents: 10,
      others: 20,
    };

    this.ensureUploadDirectory();

    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const category = this.getFileCategory(file);
        const uploadPath = path.join(this.uploadDir, category);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1000000);
        const filename = `${timestamp}-${random}${ext}`;
        cb(null, filename);
      },
    });

    this.fileFilter = (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (this.allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${ext} not allowed. Allowed: ${this.allowedExtensions.join(", ")}`), false);
      }
    };

    this.upload = multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 20 * 1024 * 1024,
        files: 5,
      },
    });
  }

  ensureUploadDirectory() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFileCategory(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    for (const [category, extensions] of Object.entries(this.fileCategories)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }
    return "others";
  }

  validateFileSize(file) {
    const category = this.getFileCategory(file);
    const maxSize = this.sizeLimits[category] * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`${category} files must be less than ${this.sizeLimits[category]}MB`);
    }
    return true;
  }

  handleError(error, res) {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case "LIMIT_FILE_SIZE":
          return res.status(400).json({ error: "File too large. Max 20MB" });
        case "LIMIT_FILE_COUNT":
          return res.status(400).json({ error: "Too many files. Max 5 files" });
        case "LIMIT_UNEXPECTED_FILE":
          return res.status(400).json({ error: "Unexpected field name" });
        default:
          return res.status(400).json({ error: error.message });
      }
    }
    return res.status(400).json({ error: error.message });
  }

  getFileInfo(file) {
    if (!file) return null;
    const category = this.getFileCategory(file);
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      category: category,
      path: file.path,
      url: `/documents/${category}/${file.filename}`,
      uploadedAt: new Date(),
    };
  }

  single(fieldName = "document") {
    return (req, res, next) => {
      this.upload.single(fieldName)(req, res, (err) => {
        if (err) {
          return this.handleError(err, res);
        }
        if (req.file) {
          try {
            this.validateFileSize(req.file);
          } catch (error) {
            fs.unlink(req.file.path, () => {});
            return this.handleError(error, res);
          }
        }
        next();
      });
    };
  }

  multiple(fieldName = "attachments", maxCount = 5) {
    return (req, res, next) => {
      this.upload.array(fieldName, maxCount)(req, res, (err) => {
        if (err) {
          return this.handleError(err, res);
        }
        if (req.files && req.files.length) {
          try {
            req.files.forEach((file) => this.validateFileSize(file));
          } catch (error) {
            req.files.forEach((file) => {
              fs.unlink(file.path, () => {});
            });
            return this.handleError(error, res);
          }
        }
        next();
      });
    };
  }
}

module.exports = new DocumentUpload();
