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
    this.resendVerificationCode = this.resendVerificationCode.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.buildUserResponse = this.buildUserResponse.bind(this);
  }

  /**
   * Sanitizes user object for frontend consumption
   */
  buildUserResponse(user) {
    if (!user) return null;
    return {
      id: user._id,
      uid: user.uid, // Internal ID
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
      const { email, password, fullName } = req.body;
      console.log(`[Auth] Registration attempt for email: ${email}`);

      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() }).select("+password");

      if (existingUser) {
        console.log(`[Auth] Existing user found for ${email}`);
        if (existingUser.isDeleted) return res.status(400).json({ message: "Account does not exist" });
        if (existingUser.status === "deactivated") return res.status(403).json({ message: "Account deactivated" });

        const isMatch = await existingUser.comparePassword(password);
        if (isMatch) {
            console.log(`[Auth] Password match for existing user ${email}. Resuming signup.`);
            if (!existingUser.emailVerified) {
                // Generate and resend a new code
                const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                existingUser.emailVerificationCode = newCode;
                existingUser.emailVerificationExpires = Date.now() + 24 * 3600000;
                await existingUser.save();
                
                try {
                    await emailService.sendVerificationEmail(existingUser.email, newCode);
                } catch (e) { console.error("Resend code fail:", e.message); }

                return res.status(200).json({ 
                    message: "Account already exists. A new verification code has been sent to your email.",
                    resume: true,
                    emailVerified: false
                });
            }
            
            const token = signToken(existingUser._id.toString());
            return res.status(200).json({
                message: "Account already exists, resuming process",
                resume: true,
                emailVerified: true,
                token,
                user: this.buildUserResponse(existingUser)
            });
        }
        console.log(`[Auth] Email already taken (password mismatch) for ${email}`);
        return res.status(400).json({ message: "Email already taken" });
      }

      console.log(`[Auth] Creating new user for ${email}`);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 24 * 3600000; // 24 hours

      const user = new User({
        email: email.toLowerCase(),
        password,
        fullName,
        authProvider: "local",
        emailVerificationCode: verificationCode,
        emailVerificationExpires: expires
      });

      await user.save();
      console.log(`[Auth] New user saved: ${user._id}`);

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user.email, verificationCode);
        console.log(`[Auth] Verification email sent to ${email}`);
      } catch (emailError) {
        console.error(`[Auth] Email send failed for ${email}:`, emailError.message);
      }

      return res.status(201).json({ 
        message: "Registration successful. Please check your email to verify your account.",
        email: user.email
      });
    } catch (error) {
      console.error("[Auth] Registration Error:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: `Registration failed: ${error.message}` });
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

      // Block users who haven't completed onboarding/signup process
      if (!user.profileCompleted) {
        return res.status(403).json({ 
          message: "Signup incomplete. Please complete your registration on the signup page." 
        });
      }

      user.lastLogin = Date.now();
      await user.save();

      const token = signToken(user._id.toString());

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
      const token = signToken(user._id.toString());

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
   * Verify email address using 6-digit code
   */
  async verifyEmail(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const user = await User.findOne({ 
        email: email.toLowerCase(),
        emailVerificationCode: code,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      user.emailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationExpires = null;
      await user.save();

      const token = signToken(user._id.toString());

      return res.status(200).json({ 
        message: "Email verified successfully!",
        token,
        user: this.buildUserResponse(user)
      });
    } catch (error) {
      console.error("Email Verification Error:", error);
      return res.status(500).json({ message: "Email verification failed" });
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await User.findOne({ email: email.toLowerCase(), authProvider: "local" });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.emailVerified) return res.status(400).json({ message: "Email already verified" });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailVerificationCode = code;
      user.emailVerificationExpires = Date.now() + 24 * 3600000;
      await user.save();

      await emailService.sendVerificationEmail(user.email, code);

      return res.status(200).json({ message: "New verification code sent!" });
    } catch (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ message: "Failed to resend code" });
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
      const allowedUpdates = ["fullName", "phone", "profileImage"];
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
