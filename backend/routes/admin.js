const express = require("express");
const router = express.Router();
const adminController = require("../controller/admincontroller");
const { authmiddleware, adminmiddleware } = require("../middleware/authmiddle");

// Apply middlewares
router.use(authmiddleware);
router.use(adminmiddleware);

// Define routes
router.get("/pending", adminController.getPendingUsers);
router.get("/pending-verifications", adminController.getPendingVerifications);
router.get("/users", adminController.getAllUsers);
router.put("/approve/:userId", adminController.approveUser);
router.put("/reject/:userId", adminController.rejectuser);
router.put("/approve-verification/:userId", adminController.approveVerification);
router.put("/reject-verification/:userId", adminController.rejectVerification);
router.put("/archive/:userId", adminController.softDeleteUser);
router.put("/restore/:userId", adminController.reactivateUser);
router.get("/check-deletion/:userId", adminController.checkUserDeletion);
router.delete("/delete/:userId", adminController.deleteuser);

module.exports = router;
