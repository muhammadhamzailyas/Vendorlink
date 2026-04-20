const express = require("express");
const router = express.Router();
const onboardingController = require("../controller/onboardingcontroller");
const { onboardingDocumentUpload } = require("../middleware/onboardingUpload");
const authMiddleware = require("../middleware/authmiddle");

router.get("/plans", onboardingController.getPlans.bind(onboardingController));

// Route to initiate real Stripe payment
router.post("/create-payment-intent", onboardingController.createPaymentIntent.bind(onboardingController));

// Unified final submission
router.post(
  "/final-submit",
  authMiddleware.authAllowUnprovisioned.bind(authMiddleware),
  onboardingDocumentUpload,
  onboardingController.finalSubmit.bind(onboardingController)
);

module.exports = router;
