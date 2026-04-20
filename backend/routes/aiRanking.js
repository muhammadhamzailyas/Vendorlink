const express = require("express");
const router = express.Router();
const aiRankingController = require("../controller/aiRankingController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

// POST /api/ai/rank/:taskId - Rank proposals for a task
router.post("/rank/:taskId", aiRankingController.rankProposals.bind(aiRankingController));

// GET /api/ai/vendor-history/:vendorId - Get vendor history summary
router.get("/vendor-history/:vendorId", aiRankingController.getVendorHistory.bind(aiRankingController));

module.exports = router;
