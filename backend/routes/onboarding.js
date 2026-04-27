const express = require("express");
const router = express.Router();
const onboardingController = require("../controller/onboardingcontroller");
const { onboardingDocumentUpload } = require("../middleware/onboardingUpload");
const { authAllowUnprovisioned } = require("../middleware/authmiddle");

/**
 * Onboarding routes are now simplified to handle only final registration and payments.
 * Partial progress and draft tracking have been removed as per requirements.
 */

// Route to initiate Stripe payment for activation fee
router.post("/create-payment-intent", authAllowUnprovisioned, onboardingController.createPaymentIntent.bind(onboardingController));

// Unified final submission: Creates the MongoDB user and profile after Step 5
router.post(
  "/final-submit",
  authAllowUnprovisioned,
  onboardingDocumentUpload,
  onboardingController.finalSubmit.bind(onboardingController)
);

module.exports = router;
