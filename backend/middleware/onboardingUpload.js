const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use user ID from verified token attached by authMiddleware
    const uid = req.tokenPayload?.id || "unidentified";
    const uploadPath = path.join("uploads", "onboarding", uid);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only .png, .jpg, .jpeg and .pdf formats allowed!"));
};

const onboardingDocumentUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).fields([
  { name: "registrationCertificate", maxCount: 1 },
  { name: "ntnCertificate", maxCount: 1 },
  { name: "supportingDocument", maxCount: 1 },
  { name: "cnicFront", maxCount: 1 },
  { name: "cnicBack", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "portfolioSamples", maxCount: 1 },
]);

module.exports = { onboardingDocumentUpload };
