const express = require("express");
const router = express.Router();
const progressController = require("../controller/progressController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

// Vendor routes
router.get("/vendor/active-contracts", progressController.getVendorActiveTasks);
router.get("/task/:taskId", progressController.getTaskProgress);
router.post("/task/:taskId/update", progressController.addProgressUpdate);
router.post("/task/:taskId/complete", progressController.requestProjectCompletion);
router.get("/task/:taskId/history", progressController.getProgressHistory);

// Company routes
router.get("/company/active-contracts", progressController.getCompanyActiveTasks);
router.get("/company/task/:taskId", progressController.getCompanyTaskProgress);
router.post("/company/task/:taskId/approve-completion", progressController.approveProjectCompletion);
router.get("/company/task/:taskId/history", progressController.getCompanyProgressHistory);
router.get("/company/task/:taskId/export", progressController.exportProgressReport);

module.exports = router;
