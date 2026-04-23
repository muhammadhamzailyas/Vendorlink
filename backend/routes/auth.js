const express = require("express");
const router = express.Router();
const authController = require("../controller/authcontroller");
const { authmiddleware, authAllowUnprovisioned, verifyFirebaseToken } = require("../middleware/authmiddle");
const { z } = require("zod");

// Validations
const firebaseLoginSchema = z.object({
  idToken: z.string().min(1),
});

const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  profileImage: z.string().url().optional(),
});

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

/**
 * @route   POST /api/auth/firebase-login
 * @desc    Sync Firebase identity with MongoDB
 * @access  Public (Requires Firebase ID Token)
 */
router.post(
  "/firebase-login",
  validateBody(firebaseLoginSchema),
  (req, _, next) => {
    // Manually inject token for middleware compatibility
    req.headers.authorization = `Bearer ${req.body.idToken}`;
    next();
  },
  verifyFirebaseToken,
  authController.firebaseLogin
);

/**
 * @route   GET /api/auth/session/bootstrap
 * @desc    Check user state and onboarding status
 * @access  Private (Firebase token)
 */
router.get(
  "/session/bootstrap", 
  authAllowUnprovisioned, 
  authController.sessionBootstrap
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (Authenticated)
 */
router.get(
  "/me", 
  authmiddleware, 
  authController.getMe
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private (Authenticated)
 */
router.put(
  "/me",
  authmiddleware,
  validateBody(updateProfileSchema),
  authController.updateMe
);

module.exports = router;
