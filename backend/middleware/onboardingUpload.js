const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Enhanced Multer Storage
 * Organizes files by firebaseUid to prevent collisions and keep the filesystem clean.
 */
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // Get firebaseUid from verified token attached by authMiddleware
    const uid = req.firebaseUser?.uid || "unidentified";
    const dir = path.join("uploads", "users", uid);

    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    // Create a clean, timestamped filename
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
    callback(null, uniqueName);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

const fileFilter = (req, file, callback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Unsupported document type. Allowed: PDF, JPG, PNG, WEBP"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB per file
  },
});

/**
 * Specialized middleware for onboarding document upload.
 * Maps incoming files to specific fields in req.files
 */
const onboardingDocumentUpload = (req, res, next) => {
  const fields = [
    // Company document fields
    { name: "registrationCertificate", maxCount: 1 },
    { name: "ntnCertificate", maxCount: 1 },
    { name: "supportingDocument", maxCount: 1 },
    // Vendor document fields
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "businessLicense", maxCount: 1 },
    { name: "portfolioSamples", maxCount: 1 },
  ];

  upload.fields(fields)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "One or more files are too large (Max 10MB per file)" });
      }
      return res.status(400).json({ message: `Multer Error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

module.exports = { onboardingDocumentUpload };
