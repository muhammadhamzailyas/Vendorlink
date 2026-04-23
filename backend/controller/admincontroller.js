const User = require("../model/user");
const Company = require("../model/company");
const Vendor = require("../model/vendor");
const Task = require("../model/task");
const Proposal = require("../model/proposal");
const Contract = require("../model/Contract");
const Payment = require("../model/Payment");
const Notification = require("../model/Notification");
const { Message: ChatMessage } = require("../model/Chat");
const ProgressUpdate = require("../model/ProgressUpdate");
const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");

const getNotificationService = (req) => {
  try { return req.app?.get("notificationService"); } catch { return null; }
};

const ARCHIVE_ELIGIBLE_ROLES = new Set(["company", "vendor"]);
const LIVE_CONTRACT_STATUSES = ["active", "pending-company", "pending-vendor", "disputed"];
const BLOCKING_PAYMENT_STATUSES = ["pending", "processing"];
const BLOCKING_TRANSACTION_STATUSES = ["pending"];
const ARCHIVE_RETENTION_MESSAGE =
  "Tasks, proposals, payments, chats, notifications, wallets, and transactions will be retained for audit and legal follow-up.";

class AdminController {
  async getPendingUsers(req, res) {
    try {
      const pendingUsers = await User.find({ status: "pending", isDeleted: false }).select("-passwordHash");
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await User.find({
        status: { $ne: "incomplete" },
        isDeleted: false,
      })
        .select("-passwordHash")
        .lean();

      const userIds = users.map((u) => u._id);
      const [companies, vendors] = await Promise.all([
        Company.find({ userId: { $in: userIds } }).lean(),
        Vendor.find({ userId: { $in: userIds } }).lean(),
      ]);

      const companyMap = new Map(companies.map((c) => [String(c.userId), c]));
      const vendorMap = new Map(vendors.map((v) => [String(v.userId), v]));

      const payload = users.map((user) => ({
        ...user,
        companyName: companyMap.get(String(user._id))?.companyName || "",
        companyProfile: companyMap.get(String(user._id)) || null,
        vendorProfile: vendorMap.get(String(user._id)) || null,
      }));

      res.json(payload);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async approveUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndUpdate(
        userId,
        { status: "approved" },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User approved successfully",
        user,
      });

      // Notify user
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: user._id,
            senderId: req.user._id,
            type: "account_approved",
            title: "Account Approved",
            message: "Your account has been approved! You can now access all features.",
            data: { userId: user._id },
            relatedId: user._id,
            relatedModel: "User",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send approval notification:", notifError);
      }
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async rejectuser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndUpdate(
        userId,
        { status: "rejected" },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User rejected successfully",
        user,
      });

      // Notify user
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: user._id,
            senderId: req.user._id,
            type: "account_rejected",
            title: "Account Rejected",
            message: "Your account has been rejected. Please contact support for more information.",
            data: { userId: user._id },
            relatedId: user._id,
            relatedModel: "User",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send rejection notification:", notifError);
      }
    } catch (error) {
      console.error("Reject user error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndUpdate(
        userId,
        { status: "deactivated" },
        { new: true }
      ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deactivated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  createRequestError(status, message, payload = {}) {
    const error = new Error(message);
    error.status = status;
    error.payload = payload;
    return error;
  }

  getUserContractQuery(userId) {
    return { $or: [{ companyId: userId }, { vendorId: userId }] };
  }

  getUserPaymentQuery(userId) {
    return { $or: [{ companyId: userId }, { vendorId: userId }] };
  }

  getUserTransactionQuery(userId) {
    return { $or: [{ fromUserId: userId }, { toUserId: userId }] };
  }

  getUserNotificationQuery(userId) {
    return { $or: [{ recipientId: userId }, { senderId: userId }] };
  }

  getUserChatQuery(userId) {
    return { $or: [{ senderId: userId }, { receiverId: userId }] };
  }

  getUserProgressQuery(userId) {
    return { $or: [{ companyId: userId }, { vendorId: userId }] };
  }

  getUserTaskQuery(userId) {
    return { $or: [{ companyId: userId }, { selectedVendor: userId }] };
  }

  getUserProposalQuery(userId) {
    return { $or: [{ vendorId: userId }, { companyId: userId }] };
  }

  buildAdminArchiveReason(user, reason) {
    return `Contract cancelled because the ${user.role} account ${user.email} was archived by an administrator. Reason: ${reason}`;
  }

  sanitizeUser(user) {
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      isDeleted: user.isDeleted,
    };
  }

  handleRequestError(res, error, fallbackMessage, logLabel) {
    if (error?.status) {
      return res.status(error.status).json({
        message: error.message,
        ...(error.payload || {}),
      });
    }

    if (logLabel) {
      console.error(logLabel, error);
    }

    return res.status(500).json({
      message: fallbackMessage,
      error: error.message,
    });
  }

  async getArchivableUserOrThrow(userId) {
    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      throw this.createRequestError(404, "User not found");
    }

    if (!ARCHIVE_ELIGIBLE_ROLES.has(user.role)) {
      throw this.createRequestError(
        400,
        "Only company and vendor accounts can be archived from user management."
      );
    }

    if (user.isDeleted) {
      throw this.createRequestError(409, "User is already archived.");
    }

    return user;
  }

  async buildArchiveBriefing(user) {
    const userId = user._id;
    const contractQuery = this.getUserContractQuery(userId);
    const paymentQuery = this.getUserPaymentQuery(userId);
    const transactionQuery = this.getUserTransactionQuery(userId);

    const [
      liveContracts,
      pendingPayments,
      pendingTransactions,
      wallet,
      tasks,
      proposals,
      contracts,
      payments,
      completedPayments,
      notifications,
      chats,
      progressUpdates,
    ] = await Promise.all([
      Contract.find({ ...contractQuery, status: { $in: LIVE_CONTRACT_STATUSES } }),
      Payment.find({ ...paymentQuery, status: { $in: BLOCKING_PAYMENT_STATUSES } }),
      Transaction.find({
        ...transactionQuery,
        status: { $in: BLOCKING_TRANSACTION_STATUSES },
      }),
      Wallet.findOne({ userId }),
      Task.countDocuments(this.getUserTaskQuery(userId)),
      Proposal.countDocuments(this.getUserProposalQuery(userId)),
      Contract.countDocuments(contractQuery),
      Payment.countDocuments(paymentQuery),
      Payment.countDocuments({ ...paymentQuery, status: "completed" }),
      Notification.countDocuments(this.getUserNotificationQuery(userId)),
      ChatMessage.countDocuments(this.getUserChatQuery(userId)),
      ProgressUpdate.countDocuments(this.getUserProgressQuery(userId)),
    ]);

    const walletBalance = Number(wallet?.balance || 0);
    const lockedBalance = Number(wallet?.lockedBalance || 0);
    const pendingPaymentTotal = pendingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const pendingTransactionTotal = pendingTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    );

    const blockers = [];
    if (pendingPayments.length > 0) {
      blockers.push({
        code: "pending_payments",
        message: `User has ${pendingPayments.length} pending or processing payment(s) that must be resolved before archiving.`,
        count: pendingPayments.length,
        totalAmount: pendingPaymentTotal,
        details: pendingPayments.map((payment) => ({
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          contractId: payment.contractId,
        })),
      });
    }

    if (pendingTransactions.length > 0) {
      blockers.push({
        code: "pending_transactions",
        message: `User has ${pendingTransactions.length} pending transaction(s) that must clear before archiving.`,
        count: pendingTransactions.length,
        totalAmount: pendingTransactionTotal,
        details: pendingTransactions.map((transaction) => ({
          id: transaction._id,
          amount: transaction.amount,
          status: transaction.status,
          type: transaction.type,
        })),
      });
    }

    if (walletBalance > 0) {
      blockers.push({
        code: "wallet_balance",
        message: `User still has an available wallet balance of ${walletBalance.toFixed(2)} that must be settled before archiving.`,
        amount: walletBalance,
      });
    }

    if (lockedBalance > 0) {
      blockers.push({
        code: "locked_wallet_balance",
        message: `User still has ${lockedBalance.toFixed(2)} in locked wallet funds that must be resolved before archiving.`,
        amount: lockedBalance,
      });
    }

    const warnings = [];
    if (liveContracts.length > 0) {
      warnings.push({
        code: "live_contracts",
        message: `User is involved in ${liveContracts.length} live contract(s). Continuing will cancel those contracts, store the admin reason, and notify the other party.`,
        count: liveContracts.length,
        details: liveContracts.map((contract) => ({
          id: contract._id,
          title: contract.title,
          status: contract.status,
        })),
      });
    }

    return {
      user: this.sanitizeUser(user),
      canProceed: blockers.length === 0,
      blockers,
      warnings,
      impactSummary: {
        money: {
          currency: wallet?.currency || "PKR",
          walletBalance,
          lockedBalance,
          pendingPayments: {
            count: pendingPayments.length,
            totalAmount: pendingPaymentTotal,
          },
          pendingTransactions: {
            count: pendingTransactions.length,
            totalAmount: pendingTransactionTotal,
          },
        },
        retainedRecords: {
          tasks,
          proposals,
          contracts,
          liveContracts: liveContracts.length,
          payments,
          completedPayments,
          notifications,
          chats,
          progressUpdates,
        },
      },
      resultIfConfirmed: {
        action: "archive_user",
        requiresWarningAcknowledgement: warnings.length > 0,
        userAccess:
          "The user will immediately lose login access and disappear from active admin user lists.",
        contractOutcome:
          liveContracts.length > 0
            ? `${liveContracts.length} live contract(s) will be cancelled and the other party will be notified.`
            : "No live contracts will be changed.",
        dataRetention: ARCHIVE_RETENTION_MESSAGE,
      },
    };
  }

  async cancelLiveContractsForArchive(user, reason, adminUserId) {
    const liveContracts = await Contract.find({
      ...this.getUserContractQuery(user._id),
      status: { $in: LIVE_CONTRACT_STATUSES },
    });

    if (liveContracts.length === 0) {
      return [];
    }

    const cancelledAt = new Date();
    const cancellationReason = this.buildAdminArchiveReason(user, reason);

    for (const contract of liveContracts) {
      contract.status = "cancelled";
      contract.cancelledAt = cancelledAt;
      contract.cancelledBy = adminUserId;
      contract.cancellationReason = cancellationReason;
      await contract.save();
    }

    return liveContracts;
  }

  async notifyArchiveCounterparties(req, archivedUser, cancelledContracts, reason) {
    if (!cancelledContracts.length) {
      return 0;
    }

    const notificationService = getNotificationService(req);
    let notificationCount = 0;

    for (const contract of cancelledContracts) {
      const recipientId =
        String(contract.companyId) === String(archivedUser._id)
          ? contract.vendorId
          : contract.companyId;

      if (!recipientId) {
        continue;
      }

      const payload = {
        recipientId,
        senderId: req.user?._id || null,
        type: "contract_cancelled",
        title: "Contract Ended by Administration",
        message: `The contract "${contract.title}" was cancelled because the ${archivedUser.role} account was archived by an administrator. Reason: ${reason}`,
        data: {
          contractId: contract._id,
          archivedUserId: archivedUser._id,
          archivedUserRole: archivedUser.role,
          reason,
        },
        relatedId: contract._id,
        relatedModel: "Contract",
        priority: "high",
      };

      try {
        if (notificationService) {
          await notificationService.createNotification(payload);
        } else {
          await Notification.create(payload);
        }
        notificationCount += 1;
      } catch (error) {
        console.error(
          `Failed to notify counterparty for contract ${contract._id}:`,
          error
        );
      }
    }

    return notificationCount;
  }

  async softDeleteUser(req, res) {
    try {
      const { userId } = req.params;
      const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
      const acknowledgeWarnings = Boolean(req.body?.acknowledgeWarnings);

      if (!reason) {
        throw this.createRequestError(400, "Archive reason is required.");
      }

      const user = await this.getArchivableUserOrThrow(userId);
      const briefing = await this.buildArchiveBriefing(user);

      if (!briefing.canProceed) {
        throw this.createRequestError(
          409,
          "Archive is blocked until all money-related conditions are resolved.",
          { briefing }
        );
      }

      if (briefing.warnings.length > 0 && !acknowledgeWarnings) {
        throw this.createRequestError(
          400,
          "Please acknowledge the archive warnings before continuing.",
          { briefing }
        );
      }

      const cancelledContracts = await this.cancelLiveContractsForArchive(
        user,
        reason,
        req.user?._id || null
      );
      const notificationCount = await this.notifyArchiveCounterparties(
        req,
        user,
        cancelledContracts,
        reason
      );

      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = req.user?._id || null;
      user.deletionReason = reason;
      await user.save();

      return res.json({
        message: "User archived successfully",
        user: this.sanitizeUser(user),
        cancelledContractsCount: cancelledContracts.length,
        notificationCount,
      });
    } catch (error) {
      return this.handleRequestError(
        res,
        error,
        "Server error",
        "Soft delete user error:"
      );
    }
  }

  async reactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: "approved",
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          deletionReason: "",
        },
        { new: true }
      ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User reactivated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async checkUserDeletion(req, res) {
    try {
      const { userId } = req.params;
      const user = await this.getArchivableUserOrThrow(userId);
      const briefing = await this.buildArchiveBriefing(user);

      return res.json(briefing);
    } catch (error) {
      return this.handleRequestError(
        res,
        error,
        "Server error",
        "Check user deletion error:"
      );
    }
  }

  async deleteuser(req, res) {
    return res.status(405).json({
      message:
        "Permanent delete is disabled for admin user management. Use the archive flow instead.",
    });
  }

  async getPendingVerifications(req, res) {
    try {
      const users = await User.find({
        status: "pending",
        role: { $in: ["company", "vendor"] },
        isDeleted: false,
      })
        .select("-password -passwordHash")
        .sort({ createdAt: -1 })
        .lean();

      const userIds = users.map((user) => user._id);
      const [companies, vendors] = await Promise.all([
        Company.find({ userId: { $in: userIds } }).lean(),
        Vendor.find({ userId: { $in: userIds } }).lean(),
      ]);

      const companyMap = new Map(companies.map((company) => [String(company.userId), company]));
      const vendorMap = new Map(vendors.map((vendor) => [String(vendor.userId), vendor]));

      const payload = users.map((user) => ({
        ...user,
        companyProfile: companyMap.get(String(user._id)) || null,
        vendorProfile: vendorMap.get(String(user._id)) || null,
      }));

      return res.json(payload);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async approveVerification(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.status = "approved";
      user.onboardingStep = Math.max(user.onboardingStep || 1, 5);
      await user.save();

      // Notify user
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: user._id,
            senderId: req.user._id,
            type: "verification_approved",
            title: "Profile Verified",
            message: "Your profile has been verified and approved!",
            data: { userId: user._id },
            relatedId: user._id,
            relatedModel: "User",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send verification notification:", notifError);
      }

      return res.json({ message: "Profile approved", user });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async rejectVerification(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndUpdate(
        userId,
        { status: "rejected" },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({ message: "Profile rejected", user });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}

const adminController = new AdminController();

module.exports = adminController;
module.exports.AdminController = AdminController;
