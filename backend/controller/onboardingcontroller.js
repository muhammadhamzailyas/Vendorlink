const mongoose = require("mongoose");
const User = require("../model/user");
const Company = require("../model/company");
const Vendor = require("../model/vendor");
const Transaction = require("../model/Transaction");
const Wallet = require("../model/Wallet");
const emailService = require("../services/emailService");
const stripeService = require("../services/stripeService");

const defaultPlans = [
  { id: "free", name: "Standard", price: 0, visibility: "standard" },
  { id: "premium", name: "Premium", price: 20, visibility: "better" },
  { id: "enterprise", name: "Enterprise", price: 50, visibility: "best" },
];

/**
 * OnboardingController handles the final steps of user registration.
 * It assumes the user has already been authenticated via Firebase.
 */
class OnboardingController {
  /**
   * Saves partial onboarding progress.
   */
  async saveProgress(req, res) {
    try {
      let { account, details, step } = req.body;
      const firebaseUid = req.firebaseUser?.uid;

      if (!firebaseUid) {
        return res.status(401).json({ message: "Unverified identity" });
      }

      const parseJson = (val, fieldName) => {
        if (!val) return {};
        if (typeof val === "string") {
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
      };

      account = parseJson(account, "account");
      details = parseJson(details, "details");
      step = parseInt(step) || 1;

      let user = await User.findOne({ firebaseUid });
      if (!user) {
          const normalizedEmail = (req.firebaseUser.email || account.email || "").trim().toLowerCase();
          let username = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
          const existingUsername = await User.findOne({ username });
          if (existingUsername) username = `${username}_${Date.now().toString().slice(-4)}`;

          user = new User({
            firebaseUid,
            username,
            email: normalizedEmail,
            authProvider: "firebase",
          });
      }

      if (account.role) user.role = account.role;
      if (account.fullName) user.fullName = account.fullName;
      if (account.phone) user.phone = account.phone;
      user.onboardingStep = step;
      await user.save();

      // Handle Documents if present
      const documents = {};
      if (req.files) {
        Object.keys(req.files).forEach((key) => {
          if (req.files[key] && req.files[key][0]) {
            const filePath = req.files[key][0].path.replace(/\\/g, "/");
            documents[key] = filePath;
          }
        });
      }

      if (user.role === "company") {
          const updateData = {
              userId: user._id,
              ...details
          };
          if (documents.registrationCertificate) updateData.registrationCertificateURL = documents.registrationCertificate;
          if (documents.ntnCertificate) updateData.ntnCertificateURL = documents.ntnCertificate;
          if (documents.supportingDocument) updateData.supportingDocumentURL = documents.supportingDocument;

          await Company.findOneAndUpdate({ userId: user._id }, updateData, { upsert: true });
      } else if (user.role === "vendor") {
          const updateData = {
              userId: user._id,
              fullName: user.fullName,
              ...details
          };
          if (documents.cnicFront) updateData.cnicFrontURL = documents.cnicFront;
          if (documents.cnicBack) updateData.cnicBackURL = documents.cnicBack;
          if (documents.businessLicense) updateData.businessLicenseURL = documents.businessLicense;
          if (documents.portfolioSamples) updateData.portfolioSamplesURL = documents.portfolioSamples;

          await Vendor.findOneAndUpdate({ userId: user._id }, updateData, { upsert: true });
      }

      return res.json({ message: "Progress saved", onboardingStep: step });
    } catch (error) {
      console.error("[Onboarding] Save progress error:", error);
      return res.status(500).json({ message: "Failed to save progress", error: error.message });
    }
  }

  async resetProgress(req, res) {
    try {
      const firebaseUid = req.firebaseUser?.uid;
      if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

      const user = await User.findOne({ firebaseUid });
      if (user) {
          user.onboardingStep = 1;
          user.role = "unassigned";
          await user.save();
          
          await Company.deleteOne({ userId: user._id });
          await Vendor.deleteOne({ userId: user._id });
      }

      return res.json({ message: "Progress reset successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to reset progress" });
    }
  }

  async getMyOnboarding(req, res) {
      try {
        const firebaseUid = req.firebaseUser?.uid;
        if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findOne({ firebaseUid }).lean();
        if (!user) return res.json({ user: null });

        let details = null;
        if (user.role === "company") {
            details = await Company.findOne({ userId: user._id }).lean();
        } else if (user.role === "vendor") {
            details = await Vendor.findOne({ userId: user._id }).lean();
        }

        return res.json({ user, details });
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch onboarding state" });
      }
  }

  async getPlans(req, res) {
    return res.json(defaultPlans);
  }

  /**
   * Finalizes user profile and creates role-specific entries.
   * Atomic operation using MongoDB Transactions (if supported).
   */
  async finalSubmit(req, res) {
    console.log("[Onboarding] Starting finalSubmit process...");
    const session = await mongoose.startSession();
    let isTransactionStarted = false;

    try {
      // 1. Transaction Start (Optional/Resilient)
      try {
        await session.startTransaction();
        isTransactionStarted = true;
      } catch (err) {
        console.warn("[Onboarding] MongoDB Transactions not supported. Continuing without transaction.");
      }

      // 2. Body Parsing (Resilient to Multer/Multipart differences)
      let { account, details, plan: planId, stripePaymentId } = req.body;
      
      const parseJson = (val, fieldName) => {
        if (!val) {
            return null;
        }
        if (typeof val === "string") {
            try { return JSON.parse(val); } catch (e) { 
                console.error(`[Onboarding] Failed to parse JSON for ${fieldName}:`, val);
                return null; 
            }
        }
        return val;
      };

      account = parseJson(account, "account");
      details = parseJson(details, "details");

      // IDENTITY: Always use the verified Firebase UID from the token
      const firebaseUid = req.firebaseUser?.uid;

      if (!firebaseUid) {
        if (isTransactionStarted) await session.abortTransaction();
        return res.status(401).json({ message: "Unverified identity" });
      }

      if (!account || !account.role || !planId) {
        console.error("[Onboarding] Missing critical fields:", { 
            hasAccount: !!account, 
            role: account?.role, 
            planId 
        });
        if (isTransactionStarted) await session.abortTransaction();
        return res.status(400).json({ 
            message: "Missing required registration data",
            details: {
                account: !account ? "missing" : "ok",
                role: !account?.role ? "missing" : "ok",
                plan: !planId ? "missing" : "ok"
            }
        });
      }

      // Map uploaded files to path strings
      const documents = {};
      if (req.files) {
        Object.keys(req.files).forEach((key) => {
          if (req.files[key] && req.files[key][0]) {
            const filePath = req.files[key][0].path.replace(/\\/g, "/");
            documents[key] = filePath;
          }
        });
      }
      console.log("[Onboarding] Mapped Documents:", Object.keys(documents));

      const selectedPlan = defaultPlans.find(p => p.id === planId);
      const normalizedEmail = (req.firebaseUser.email || account.email || "").trim().toLowerCase();

      // 3. User Resolution
      let user = await User.findOne({ firebaseUid }).session(isTransactionStarted ? session : null);
      console.log("[Onboarding] User lookup result:", user ? "Found" : "Not Found");

      // 4. Stripe Verification (Non-blocking for Free Plan)
      if (selectedPlan && selectedPlan.price > 0) {
          if (!stripePaymentId) {
              if (isTransactionStarted) await session.abortTransaction();
              return res.status(400).json({ message: "Payment required for selected plan" });
          }
          const isVerified = await stripeService.verifyPayment(stripePaymentId);
          if (!isVerified) {
              if (isTransactionStarted) await session.abortTransaction();
              return res.status(400).json({ message: "Payment verification failed" });
          }
      }

      // 5. User Creation/Update
      if (!user) {
        let username = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
        const existingUsername = await User.findOne({ username }).session(isTransactionStarted ? session : null);
        if (existingUsername) username = `${username}_${Date.now().toString().slice(-4)}`;

        user = new User({
          firebaseUid,
          username,
          email: normalizedEmail,
          authProvider: "firebase",
        });
      }

      user.fullName = account.fullName;
      user.role = account.role;
      user.phone = account.phone || "";
      user.status = "pending"; 
      user.profileCompleted = true;
      user.onboardingStep = 5;
      user.selectedPlan = planId;
      user.emailVerified = true;

      await user.save({ session: isTransactionStarted ? session : null });

      // 6. Initialize Wallet
      const existingWallet = await Wallet.findOne({ userId: user._id }).session(isTransactionStarted ? session : null);
      if (!existingWallet) {
        await Wallet.create([{ userId: user._id, balance: 0 }], { session: isTransactionStarted ? session : null });
      }

      // 7. Profile Specifics
      const profileOptions = { upsert: true, session: isTransactionStarted ? session : null };
      if (account.role === "company") {
        await Company.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            companyName: details.companyName,
            businessType: details.businessType,
            industry: details.industry,
            registrationNumber: details.registrationNumber,
            ntn: details.ntn,
            yearEstablished: details.yearEstablished,
            website: details.website,
            companySize: details.companySize,
            description: details.description,
            city: details.city,
            province: details.province,
            country: details.countryName || details.country,
            streetAddress: details.streetAddress,
            registrationCertificateURL: documents.registrationCertificate || "",
            ntnCertificateURL: documents.ntnCertificate || "",
            supportingDocumentURL: documents.supportingDocument || "",
          },
          profileOptions
        );
      } else if (account.role === "vendor") {
        await Vendor.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            fullName: account.fullName,
            vendorType: details.vendorType,
            cnicNumber: details.cnicNumber,
            businessName: details.businessName,
            registrationNumber: details.registrationNumber,
            ntn: details.ntn,
            category: details.category,
            skills: details.skills || [],
            yearsOfExperience: details.yearsOfExperience,
            portfolioURL: details.portfolioURL,
            bio: details.bio,
            city: details.city,
            province: details.province,
            country: details.countryName || details.country,
            streetAddress: details.streetAddress,
            cnicFrontURL: documents.cnicFront || "",
            cnicBackURL: documents.cnicBack || "",
            businessLicenseURL: documents.businessLicense || "",
            portfolioSamplesURL: documents.portfolioSamples || "",
          },
          profileOptions
        );
      }

      // 8. Transaction Record
      if (stripePaymentId && selectedPlan && selectedPlan.price > 0) {
          await Transaction.create([{
              fromUserId: user._id,
              toUserId: null,
              amount: selectedPlan.price,
              type: "subscription",
              status: "completed",
              paymentMethod: "stripe",
              description: `${selectedPlan.name} Subscription Plan`,
              gateway: { name: "stripe", transactionId: stripePaymentId }
          }], { session: isTransactionStarted ? session : null });
      }

      if (isTransactionStarted) await session.commitTransaction();

      // 9. Post-registration Notifications
      this.sendWelcomeNotifications(user, req.app?.get("notificationService"));

      return res.status(201).json({ 
          message: "Registration successful. Pending admin approval.",
          userId: user._id
      });

    } catch (error) {
      if (isTransactionStarted) await session.abortTransaction();
      console.error("[Onboarding] Final submit error:", error);
      return res.status(500).json({ message: "Onboarding failed. Please try again.", error: error.message });
    } finally {
      session.endSession();
    }
  }

  async sendWelcomeNotifications(user, notificationService) {
    try {
      await emailService.sendOnboardingWelcome(user);
      if (notificationService) {
        const admins = await User.find({ role: "admin" }).select("_id");
        for (const admin of admins) {
          await notificationService.createNotification({
            recipientId: admin._id,
            senderId: user._id,
            type: "new_user",
            title: "New Registration Pending",
            message: `New ${user.role} "${user.fullName}" has registered and needs approval.`,
            data: { userId: user._id, role: user.role },
            priority: "medium",
          });
        }
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  }

  async createPaymentIntent(req, res) {
      try {
          const { planId } = req.body;
          const plan = defaultPlans.find(p => p.id === planId);
          if (!plan || plan.price <= 0) {
              return res.status(400).json({ message: "Invalid plan or no payment required" });
          }

          const intent = await stripeService.createPaymentIntent(plan.price, "usd", {
              planId: plan.id,
              planName: plan.name
          });

          return res.json(intent);
      } catch (error) {
          return res.status(500).json({ message: "Payment gateway error", error: error.message });
      }
  }
}

module.exports = new OnboardingController();
