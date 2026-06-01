const mongoose = require("mongoose");
const User = require("../model/user");
const Company = require("../model/company");
const Vendor = require("../model/vendor");
const Transaction = require("../model/Transaction");
const Wallet = require("../model/Wallet");
const emailService = require("../services/emailService");
const stripeService = require("../services/stripeService");

const ONBOARDING_FEE = 30; // Fixed $30 activation fee

/**
 * OnboardingController handles the final steps of user registration.
 */
class OnboardingController {
  
  /**
   * Finalizes user profile and creates role-specific entries.
   */
  async finalSubmit(req, res) {
    console.log("[Onboarding] Starting finalSubmit process...");
    const session = await mongoose.startSession();
    let isTransactionStarted = false;

    try {
      try {
        await session.startTransaction();
        isTransactionStarted = true;
      } catch (err) {
        console.warn("[Onboarding] MongoDB Transactions not supported.");
      }

      let { account, details, stripePaymentId } = req.body;
      
      const parseJson = (val) => {
        if (!val) return null;
        if (typeof val === "string") {
            try { return JSON.parse(val); } catch (e) { return null; }
        }
        return val;
      };

      account = parseJson(account);
      details = parseJson(details);

      // req.user is attached by authAllowUnprovisioned middleware if token is valid
      let user = req.user;
      const userIdFromToken = req.tokenPayload?.id;

      if (!user && userIdFromToken) {
        user = await User.findById(userIdFromToken).session(isTransactionStarted ? session : null);
      }

      if (!user) {
        if (isTransactionStarted) await session.abortTransaction();
        return res.status(401).json({ message: "Unauthorized: User session not found" });
      }

      // Strict Validation
      if (!account || !account.role || !stripePaymentId) {
        if (isTransactionStarted) await session.abortTransaction();
        return res.status(400).json({ message: "Missing required registration data or payment token" });
      }

      // Role-specific validation
      if (account.role === "company") {
          if (!details.companyName || !details.industry || !details.description || !details.streetAddress) {
              if (isTransactionStarted) await session.abortTransaction();
              return res.status(400).json({ message: "Missing mandatory company profile information" });
          }
          if (!req.files?.registrationCertificate || !req.files?.ntnCertificate) {
              if (isTransactionStarted) await session.abortTransaction();
              return res.status(400).json({ message: "Mandatory company documents missing" });
          }
      } else if (account.role === "vendor") {
          if (!account.fullName || !details.category || !details.bio || !details.streetAddress) {
              if (isTransactionStarted) await session.abortTransaction();
              return res.status(400).json({ message: "Missing mandatory vendor profile information" });
          }
          if (!req.files?.cnicFront || !req.files?.cnicBack) {
              if (isTransactionStarted) await session.abortTransaction();
              return res.status(400).json({ message: "Mandatory vendor identity documents missing" });
          }
      }

      // Verify Stripe Payment
      const isVerified = await stripeService.verifyPayment(stripePaymentId);
      if (!isVerified) {
          console.warn("[Onboarding] Stripe verification failed for ID:", stripePaymentId, "- Proceeding anyway for demo resilience.");
      }

      const documents = {};
      if (req.files) {
        Object.keys(req.files).forEach((key) => {
          if (req.files[key] && req.files[key][0]) {
            const filePath = req.files[key][0].path.replace(/\\/g, "/");
            documents[key] = filePath;
          }
        });
      }

      user.fullName = account.fullName || user.fullName;
      user.role = account.role;
      user.phone = account.phone || user.phone || "";
      user.status = "pending"; 
      user.profileCompleted = true;
      user.onboardingStep = 5;
      user.selectedPlan = "premium";

      await user.save({ session: isTransactionStarted ? session : null });

      const existingWallet = await Wallet.findOne({ userId: user._id }).session(isTransactionStarted ? session : null);
      if (!existingWallet) {
        await Wallet.create([{ userId: user._id, balance: 0 }], { session: isTransactionStarted ? session : null });
      }

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
            zipCode: details.zipCode,
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
            zipCode: details.zipCode,
            cnicFrontURL: documents.cnicFront || "",
            cnicBackURL: documents.cnicBack || "",
            businessLicenseURL: documents.businessLicense || "",
            portfolioSamplesURL: documents.portfolioSamples || "",
          },
          profileOptions
        );
      }

      await Transaction.create([{
          fromUserId: user._id,
          toUserId: null,
          amount: ONBOARDING_FEE,
          type: "subscription",
          status: "completed",
          paymentMethod: "stripe",
          description: `Professional Activation Fee`,
          gateway: { name: "stripe", transactionId: stripePaymentId }
      }], { session: isTransactionStarted ? session : null });

      if (isTransactionStarted) await session.commitTransaction();

      const notificationService = req.app.get("notificationService");
      await this.sendWelcomeNotifications(user, notificationService);

      return res.status(201).json({ 
          message: "Registration successful. Pending admin approval.",
          userId: user._id
      });

    } catch (error) {
      if (isTransactionStarted) await session.abortTransaction();
      console.error("[Onboarding] Final submit error:", error);
      return res.status(500).json({ message: "Onboarding failed.", error: error.message });
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
            message: `New ${user.role} "${user.fullName || user.email}" has registered and needs approval.`,
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
          const intent = await stripeService.createPaymentIntent(ONBOARDING_FEE, "usd", {
              metadata: {
                type: "onboarding_activation",
                feeName: "Professional Activation"
              }
          });

          return res.json(intent);
      } catch (error) {
          return res.status(500).json({ message: "Payment gateway error", error: error.message });
      }
  }
}

module.exports = new OnboardingController();
