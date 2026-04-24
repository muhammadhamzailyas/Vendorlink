const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const { authmiddleware, adminmiddleware } = require("../middleware/authmiddle");

// ==================== WEBHOOK ROUTE ====================
// Must be before authmiddleware and express.json()
router.post("/webhook", express.raw({ type: "application/json" }), paymentController.handleWebhook.bind(paymentController));

// Apply auth middleware to all other routes
router.use(authmiddleware);

// ==================== WALLET ROUTES ====================
router.get("/wallet", paymentController.getWallet.bind(paymentController));
router.post("/deposit", paymentController.depositMoney.bind(paymentController));
router.post("/withdraw", paymentController.requestWithdrawal.bind(paymentController));
router.post("/payment/confirm/:paymentId", paymentController.confirmPayment.bind(paymentController));

// ==================== COMPANY ROUTES ====================
router.get("/company/active-tasks", paymentController.getCompanyActiveTasks.bind(paymentController));
router.post("/make-payment", paymentController.makePayment.bind(paymentController));

// ==================== VENDOR ROUTES ====================
router.get("/vendor/active-tasks", paymentController.getVendorActiveTasks.bind(paymentController));
router.get("/vendor/summary", paymentController.getVendorPaymentSummary.bind(paymentController));
router.post("/request-payment", paymentController.requestPayment.bind(paymentController));

// ==================== ADMIN ROUTES ====================
router.get("/admin/transactions", adminmiddleware, paymentController.getAllTransactions.bind(paymentController));
router.get("/admin/payments", adminmiddleware, paymentController.getAllPayments.bind(paymentController));
router.post("/admin/process-withdrawal", adminmiddleware, paymentController.processWithdrawal.bind(paymentController));

// ==================== COMMON ROUTES ====================
router.get("/contract/:contractId", paymentController.getContractPayments.bind(paymentController));
router.get("/:id", paymentController.getPaymentById.bind(paymentController));
router.get("/:id/invoice", paymentController.generateInvoice.bind(paymentController));

module.exports = router;
