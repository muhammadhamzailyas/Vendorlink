const express = require("express");
const router = express.Router();
const proposalController = require("../controller/proposalcontroller");
const { authmiddleware } = require("../middleware/authmiddle");

// Apply middleware
router.use(authmiddleware);

// Define routes
router.post("/", proposalController.createProposal);
router.get("/vendor/my-proposals", proposalController.getVendorProposals);
router.get("/company/received", proposalController.getCompanyProposals);
router.get("/task/:taskId", proposalController.getTaskProposals);
router.get("/:id/check-deletability", proposalController.checkDeletability);
router.put("/:id/status", proposalController.updateStatus.bind(proposalController));
router.put("/:id/accept", proposalController.acceptProposal);
router.put("/:id/reject", proposalController.rejectProposal);
router.put("/:id", proposalController.updateProposal);
router.delete("/:id", proposalController.deleteProposal);

module.exports = router;