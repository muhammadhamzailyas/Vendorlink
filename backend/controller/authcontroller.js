const crypto = require("crypto");
const User = require("../model/user");
const { signToken } = require("../utils/jwt");
const emailService = require("../services/emailService");

/**
 * AuthController manages user session and profile logic.
 */
class AuthController {
  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.googleCallback = this.googleCallback.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
  }

  /**
   * Sanitizes user object for frontend consumption
   */
  buildUserResponse(user) {
    if (!user) return null;
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      authProvider: user.authProvider,
      profileCompleted: user.profileCompleted,
      onboardingStep: user.onboardingStep,
      selectedPlan: user.selectedPlan,
      profileImage: user.profileImage || "",
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Register a new user with email/password
   */
  async register(req, res) {
    try {
      const { email, password, username } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await User.findOne({ 
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email or username already taken" });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");

      const user = new User({
        email: email.toLowerCase(),
        password,
        username: username.toLowerCase(),
        authProvider: "local",
        emailVerificationToken: verificationToken
      });

      await user.save();

      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationToken);

      return res.status(201).json({ message: "Registration successful. Please check your email to verify your account." });
    } catch (error) {
      console.error("Registration Error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  }

  /**
   * Login with email/password
   * Note: This is called AFTER passport.authenticate('local')
   */
  async login(req, res) {
    try {
      const user = req.user;

      if (user.isDeleted) {
        return res.status(404).json({ message: "Your account does not exist." });
      }
      if (user.status === "deactivated") {
        return res.status(403).json({ 
          message: "Your account has been deactivated." 
        });
      }

      // Check if promoted by admin email match (legacy logic)
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (adminEmail && user.email === adminEmail && user.role !== "admin") {
        user.role = "admin";
        user.status = "approved";
        await user.save();
      }

      user.lastLogin = Date.now();
      await user.save();

      const token = signToken(user._id);

      return res.status(200).json({
        token,
        user: this.buildUserResponse(user),
      });
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  }

  /**
   * Handle Google OAuth callback
   * Note: This is called AFTER passport.authenticate('google')
   */
  async googleCallback(req, res) {
    try {
      const user = req.user;
      const token = signToken(user._id);

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Google Auth Callback Error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await User.findOne({ emailVerificationToken: token });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      user.emailVerified = true;
      user.emailVerificationToken = null;
      await user.save();

      return res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      console.error("Email Verification Error:", error);
      return res.status(500).json({ message: "Email verification failed" });
    }
  }

  /**
   * Generate password reset token and send email
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await User.findOne({ email: email.toLowerCase(), authProvider: "local" });

      if (!user) {
        // Return success even if user not found for security reasons
        return res.status(200).json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      await emailService.sendPasswordResetEmail(user.email, resetToken);

      return res.status(200).json({ message: "Reset link sent to your email." });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      return res.status(500).json({ message: "Failed to process forgot password request" });
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      return res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset Password Error:", error);
      return res.status(500).json({ message: "Failed to reset password" });
    }
  }

  /**
   * Returns current user profile
   */
  async getMe(req, res) {
    try {
      return res.status(200).json(this.buildUserResponse(req.user));
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch profile" });
    }
  }

  /**
   * Updates user profile fields
   */
  async updateMe(req, res) {
    try {
      const allowedUpdates = ["fullName", "phone", "profileImage", "username"];
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

      if (!isValidOperation) {
        return res.status(400).json({ message: "Invalid update fields" });
      }

      updates.forEach((update) => {
        req.user[update] = req.body[update];
      });

      await req.user.save();
      return res.status(200).json(this.buildUserResponse(req.user));
    } catch (error) {
      console.error("Update Profile Error:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  }
}

module.exports = new AuthController();
