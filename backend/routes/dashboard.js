const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/dashboardController");
const { authmiddleware } = require("../middleware/authmiddle");

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics for the logged-in user (Company/Vendor)
 * @access  Private
 */
router.get("/stats", authmiddleware, dashboardController.getStats.bind(dashboardController));

module.exports = router;
