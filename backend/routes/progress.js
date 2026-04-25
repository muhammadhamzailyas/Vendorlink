const express = require("express");
const router = express.Router();
const progressController = require("../controller/progressController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

// Existing routes...
router.get("/vendor/active-contracts", progressController.getVendorActiveTasks);
router.get("/company/active-contracts", progressController.getCompanyActiveTasks);
router.get("/task/:taskId", progressController.getTaskProgress);
router.post("/task/:taskId/update", progressController.addProgressUpdate);
router.post("/task/:taskId/complete", progressController.requestProjectCompletion);
router.post("/company/task/:taskId/approve-completion", progressController.approveProjectCompletion);
router.get("/company/task/:taskId/progress", progressController.getCompanyTaskProgress);
router.get("/company/task/:taskId/history", progressController.getCompanyProgressHistory);
router.get("/company/task/:taskId/export", progressController.exportProgressReport);
router.get("/task/:taskId/history", progressController.getProgressHistory);

// New payment routes
router.get("/task/:taskId/payment-readiness", progressController.getPaymentReadiness);
router.get("/task/:taskId/payment-summary", progressController.getPaymentSummary);

module.exports = router;
