const User = require("../model/user");

/**
 * AuthController manages user session and profile logic.
 * Authentication is handled by Firebase; this controller maps Firebase identities to MongoDB profiles.
 */
class AuthController {
  constructor() {
    this.firebaseLogin = this.firebaseLogin.bind(this);
    this.getMe = this.getMe.bind(this);
    this.updateMe = this.updateMe.bind(this);
    this.sessionBootstrap = this.sessionBootstrap.bind(this);
  }

  /**
   * Sanitizes user object for frontend consumption
   */
  buildUserResponse(user) {
    if (!user) return null;
    return {
      id: user._id,
      username: user.username,
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      profileCompleted: user.profileCompleted,
      onboardingStep: user.onboardingStep,
      selectedPlan: user.selectedPlan,
      profileImage: user.profileImage || "",
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Syncs Firebase User with MongoDB.
   * If user doesn't exist, it creates a placeholder.
   * If it exists, it returns the profile.
   */
  async firebaseLogin(req, res) {
    try {
      const { uid, email, phoneNumber } = req.firebaseUser;

      if (!uid) {
        return res.status(401).json({ message: "Invalid Firebase identity" });
      }

      const normalizedEmail = (email || "").trim().toLowerCase();
      
      let user = await User.findOne({ firebaseUid: uid });
      
      if (user) {
        if (user.isDeleted) {
          return res.status(404).json({ message: "Your account does not exist." });
        }
        if (user.status === "deactivated") {
          return res.status(403).json({ 
            message: "Your account has been deactivated. You can submit some appeals to get your account back." 
          });
        }
      }

      let isNewUser = false;

      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const isAdminByEmail = normalizedEmail && adminEmail && normalizedEmail === adminEmail;

      if (!user) {
        // Check if a user with this email already exists but lacks firebaseUid (e.g. legacy or seed mismatch)
        user = await User.findOne({ email: normalizedEmail });
        
        if (user) {
          console.log(`[Auth] Linking existing user ${normalizedEmail} to new Firebase UID: ${uid}`);
          user.firebaseUid = uid;
        } else {
          // Idempotent creation of a minimal user record
          user = new User({
            firebaseUid: uid,
            email: normalizedEmail || `${uid}@no-email.vendorlink`,
            phone: phoneNumber || "",
            role: isAdminByEmail ? "admin" : "unassigned",
            status: isAdminByEmail ? "approved" : "pending",
            authProvider: "firebase",
            emailVerified: Boolean(normalizedEmail),
          });
          isNewUser = true;

          // Notify Admins about new registration
          try {
            const notificationService = req.app?.get("notificationService");
            if (notificationService) {
              const admins = await User.find({ role: "admin" }).select("_id");
              for (const admin of admins) {
                await notificationService.createNotification({
                  recipientId: admin._id,
                  type: "new_user_registered",
                  title: "New User Registration",
                  message: `A new user "${normalizedEmail}" has registered on the platform.`,
                  data: { userId: user._id, email: normalizedEmail },
                  priority: "low",
                });
              }
            }
          } catch (notifErr) {
            console.error("[Auth] Admin notification failed:", notifErr);
          }
        }
        await user.save();
      } else {
        // Update last login unconditionally for existing user
        user.lastLogin = Date.now();

        // Ensure admin status is synchronized if email matches
        if (isAdminByEmail && user.role !== "admin") {
          console.log(`[Auth] Promoting user ${normalizedEmail} to Admin based on env configuration.`);
          user.role = "admin";
          user.status = "approved";
          await user.save();
        } else {
          // Update basic info if changed in Firebase
          if (normalizedEmail && user.email !== normalizedEmail) {
            user.email = normalizedEmail;
          }
          if (phoneNumber && user.phone !== phoneNumber) {
            user.phone = phoneNumber;
          }
          await user.save();
        }
      }

      return res.status(200).json({
        user: this.buildUserResponse(user),
        isNewUser,
      });
    } catch (error) {
      console.error("Firebase Login Sync Error:", error);
      return res.status(500).json({ message: "Identity sync failed" });
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

  /**
   * Specialized endpoint for initial app load.
   * Determines if the user needs to start onboarding.
   */
  async sessionBootstrap(req, res) {
    try {
      if (!req.user) {
        return res.status(200).json({
          needsOnboarding: true,
          firebaseUser: req.firebaseUser,
        });
      }

      // Deep completeness check for existing users
      let isActuallyComplete = req.user.profileCompleted;
      if (isActuallyComplete && req.user.role !== "admin") {
          const Company = require("../model/company");
          const Vendor = require("../model/vendor");
          
          if (req.user.role === "company") {
              const profile = await Company.findOne({ userId: req.user._id });
              if (!profile || !profile.description || !profile.industry || !profile.registrationCertificateURL) {
                  isActuallyComplete = false;
              }
          } else if (req.user.role === "vendor") {
              const profile = await Vendor.findOne({ userId: req.user._id });
              if (!profile || !profile.bio || !profile.category || !profile.cnicFrontURL) {
                  isActuallyComplete = false;
              }
          }

          if (isActuallyComplete !== req.user.profileCompleted) {
              req.user.profileCompleted = isActuallyComplete;
              await req.user.save();
          }
      }

      return res.status(200).json({
        needsOnboarding: req.user.role === "unassigned",
        user: {
            ...this.buildUserResponse(req.user),
            profileCompleted: isActuallyComplete
        },
        firebaseUser: req.firebaseUser,
      });
    } catch (error) {
      console.error("Session Bootstrap Error:", error);
      return res.status(500).json({ message: "Session bootstrap failed" });
    }
  }
}

module.exports = new AuthController();
