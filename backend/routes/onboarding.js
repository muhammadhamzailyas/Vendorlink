const express = require("express");
const router = express.Router();
const onboardingController = require("../controller/onboardingcontroller");
const { onboardingDocumentUpload } = require("../middleware/onboardingUpload");
const { authAllowUnprovisioned } = require("../middleware/authmiddle");

// Track progress
router.get("/me", authAllowUnprovisioned, onboardingController.getMyOnboarding.bind(onboardingController));
router.post("/save-progress", authAllowUnprovisioned, onboardingDocumentUpload, onboardingController.saveProgress.bind(onboardingController));
router.post("/reset-progress", authAllowUnprovisioned, onboardingController.resetProgress.bind(onboardingController));

// Route to initiate real Stripe payment
router.post("/create-payment-intent", onboardingController.createPaymentIntent.bind(onboardingController));

// Unified final submission
router.post(
  "/final-submit",
  authAllowUnprovisioned,
  onboardingDocumentUpload,
  onboardingController.finalSubmit.bind(onboardingController)
);

module.exports = router;
