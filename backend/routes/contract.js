const express = require("express");
const router = express.Router();
const contractController = require("../controller/contractController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

// Create routes
router.post("/", contractController.createCompleteContract);
router.post("/create-from-proposal", contractController.createContractFromProposal);

// List routes
router.get("/company/my-contracts", contractController.getCompanyContracts);
router.get("/vendor/active", contractController.getActiveContracts);
router.get("/vendor/my-contracts", contractController.getVendorContracts);

// Download
router.get("/:id/download", contractController.downloadContract);

// Dynamic routes
router.get("/:id", contractController.getContractById);
router.get("/:id/check-deletability", contractController.checkDeletability);
router.put("/:id", contractController.updateContract);
router.put("/:id/approve", contractController.approveContract);
router.put("/:id/reject", contractController.rejectContract);
router.put("/:id/cancel", contractController.cancelContract);
router.delete("/:id", contractController.deleteContract);
router.post("/:id/notes", contractController.addNote);

module.exports = router;
