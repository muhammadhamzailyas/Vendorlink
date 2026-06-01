const express = require("express");
const passport = require("../config/passport");
const router = express.Router();
const authController = require("../controller/authcontroller");
const { authmiddleware } = require("../middleware/authmiddle");
const { z } = require("zod");

// Validations
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().trim().min(3).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  profileImage: z.string().optional(),
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

// Register
router.post("/register", validateBody(registerSchema), authController.register);

// Login (local)
router.post(
  "/login",
  validateBody(loginSchema),
  passport.authenticate("local", { session: false }),
  authController.login
);

// Google OAuth — initiate
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Google OAuth — callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallback
);

// Email verification
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerificationCode);

// Forgot password
router.post("/forgot-password", authController.forgotPassword);

// Reset password
router.put("/reset-password", authController.resetPassword);

// Current user
router.get("/me", authmiddleware, authController.getMe);
router.put(
  "/me",
  authmiddleware,
  validateBody(updateProfileSchema),
  authController.updateMe
);

module.exports = router;
