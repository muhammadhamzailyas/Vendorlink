const express = require("express");
const router = express.Router();
const adminController = require("../controller/admincontroller");
const { authmiddleware, adminmiddleware } = require("../middleware/authmiddle");

// Apply middlewares
router.use(authmiddleware);
router.use(adminmiddleware);

const contractController = require("../controller/contractController");

// Define routes
router.get("/stats", adminController.getStats);
router.get("/monitoring/tasks", adminController.getTaskMonitoring);
router.get("/monitoring/contracts", adminController.getContractMonitoring);
router.get("/activity", adminController.getGlobalActivity);
router.get("/contracts", contractController.getAllContracts);
router.get("/pending", adminController.getPendingUsers);
router.get("/pending-verifications", adminController.getPendingVerifications);
router.get("/users", adminController.getAllUsers);

// Report Generation Routes
router.get("/reports/tasks", adminController.getTaskReport);
router.get("/reports/users", adminController.getUserReport);
router.get("/reports/finance", adminController.getFinanceReport);

router.put("/approve/:userId", adminController.approveUser);
router.put("/reject/:userId", adminController.rejectuser);
router.put("/approve-verification/:userId", adminController.approveVerification);
router.put("/reject-verification/:userId", adminController.rejectVerification);
router.put("/archive/:userId", adminController.softDeleteUser);
router.put("/restore/:userId", adminController.reactivateUser);
router.get("/check-deletion/:userId", adminController.checkUserDeletion);
router.delete("/delete/:userId", adminController.deleteuser);

module.exports = router;
