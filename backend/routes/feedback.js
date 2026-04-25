const express = require("express");
const router = express.Router();
const feedbackController = require("../controller/feedbackController");
const { authmiddleware, adminmiddleware } = require("../middleware/authmiddle");

router.post("/", authmiddleware, feedbackController.submitFeedback);
router.get("/", authmiddleware, adminmiddleware, feedbackController.getAllFeedback);

module.exports = router;