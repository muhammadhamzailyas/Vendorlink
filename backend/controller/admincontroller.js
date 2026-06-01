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
const emailService = require("../services/emailService");

const getNotificationService = (req) => {
  try { return req.app?.get("notificationService"); } catch { return null; }
};

const ARCHIVE_ELIGIBLE_ROLES = new Set(["company", "vendor"]);
const LIVE_CONTRACT_STATUSES = ["active", "pending-vendor", "disputed"];
const BLOCKING_PAYMENT_STATUSES = ["pending", "processing"];
const BLOCKING_TRANSACTION_STATUSES = ["pending"];
const ARCHIVE_RETENTION_MESSAGE =
  "Tasks, proposals, payments, chats, notifications, wallets, and transactions will be retained for audit and legal follow-up.";

class AdminController {
  constructor() {
    this.getPendingUsers = this.getPendingUsers.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.approveUser = this.approveUser.bind(this);
    this.rejectuser = this.rejectuser.bind(this);
    this.deactivateUser = this.deactivateUser.bind(this);
    this.getPendingVerifications = this.getPendingVerifications.bind(this);
    this.approveVerification = this.approveVerification.bind(this);
    this.rejectVerification = this.rejectVerification.bind(this);
    this.getStats = this.getStats.bind(this);
    this.getTaskMonitoring = this.getTaskMonitoring.bind(this);
    this.getContractMonitoring = this.getContractMonitoring.bind(this);
    this.getGlobalActivity = this.getGlobalActivity.bind(this);
    this.softDeleteUser = this.softDeleteUser.bind(this);
    this.checkUserDeletion = this.checkUserDeletion.bind(this);
    this.reactivateUser = this.reactivateUser.bind(this);
  }

  async getStats(req, res) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      // 1. Cumulative Platform Growth (Area Chart)
      const usersGrowth = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, isDeleted: false, role: { $ne: "unassigned" }, status: "approved" } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const tasksGrowth = await Task.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // 2. Revenue vs Payout Gap (Stacked Bar Chart)
      const revenueStats = await Payment.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: "completed" } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            totalVolume: { $sum: "$amount" },
            platformRevenue: { $sum: "$platformFee" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // 3. Marketplace Balance (Donut Chart)
      const userRoles = await User.aggregate([
        { $match: { isDeleted: false, role: { $in: ["company", "vendor"] } } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]);

      // 4. Task Conversion Funnel (Bar Chart)
      const [openTasks, tasksWithProposals, activeContracts, completedTasks] = await Promise.all([
          Task.countDocuments({ status: "open" }),
          Proposal.distinct("taskId"),
          Contract.countDocuments({ status: "active" }),
          Task.countDocuments({ status: "completed" })
      ]);

      // 5. Settlement & Withdrawal Health (Pie Chart)
      const withdrawalHealth = await Transaction.aggregate([
        { $match: { type: "withdrawal" } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Process Monthly Data
      const months = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        months.push({
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          name: d.toLocaleString('default', { month: 'short' }),
        });
      }

      // Detailed Monthly Stats for Percentage Calculation
      const monthlyBreakdown = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, isDeleted: false, role: { $ne: "unassigned" } } },
        {
          $group: {
            _id: { 
                month: { $month: "$createdAt" }, 
                year: { $year: "$createdAt" },
                role: "$role",
                status: "$status"
            },
            count: { $sum: 1 },
          },
        },
      ]);

      const getMonthlyTotal = (m, filterFn) => {
          if (!Array.isArray(monthlyBreakdown)) return 0;
          return monthlyBreakdown
            .filter(item => item._id.month === m.month && item._id.year === m.year && filterFn(item))
            .reduce((sum, item) => sum + item.count, 0);
      };

      const growthData = months.map(m => {
        const uCount = getMonthlyTotal(m, (item) => item._id.status === "approved");
        const t = Array.isArray(tasksGrowth) ? tasksGrowth.find(tg => tg._id.month === m.month && tg._id.year === m.year) : null;
        const r = Array.isArray(revenueStats) ? revenueStats.find(rs => rs._id.month === m.month && rs._id.year === m.year) : null;
        
        return {
          name: m.name,
          users: uCount,
          tasks: t ? t.count : 0,
          totalVolume: r ? r.totalVolume : 0,
          revenue: r ? r.platformRevenue : 0,
          companies: getMonthlyTotal(m, (item) => item._id.role === "company"),
          vendors: getMonthlyTotal(m, (item) => item._id.role === "vendor"),
          pending: getMonthlyTotal(m, (item) => item._id.status === "pending"),
        };
      });

      // Calculate Percent Changes
      const lastMonth = growthData[5] || { users: 0, tasks: 0, revenue: 0, companies: 0, vendors: 0, pending: 0 };
      const prevMonth = growthData[4] || { users: 0, tasks: 0, revenue: 0, companies: 0, vendors: 0, pending: 0 };
      const calculateChange = (curr, prev) => {
          const c = Number(curr) || 0;
          const p = Number(prev) || 0;
          if (p === 0) return c > 0 ? "100.0" : "0.0";
          return (((c - p) / p) * 100).toFixed(1);
      };

      res.json({
        growthData,
        marketplaceBalance: userRoles.map(ur => ({ 
            name: ur._id === "company" ? "Companies" : "Vendors", 
            value: ur.count 
        })),
        taskFunnel: [
            { name: "Open Tasks", value: openTasks || 0 },
            { name: "With Proposals", value: Array.isArray(tasksWithProposals) ? tasksWithProposals.length : 0 },
            { name: "Active Contracts", value: activeContracts || 0 },
            { name: "Completed Tasks", value: completedTasks || 0 },
        ],
        withdrawalHealth: withdrawalHealth.map(wh => ({ 
            name: String(wh._id || "Unknown").charAt(0).toUpperCase() + String(wh._id || "Unknown").slice(1), 
            value: wh.count || 0
        })),
        changes: {
            users: calculateChange(lastMonth.users, prevMonth.users),
            tasks: calculateChange(lastMonth.tasks, prevMonth.tasks),
            revenue: calculateChange(lastMonth.revenue, prevMonth.revenue),
            companies: calculateChange(lastMonth.companies, prevMonth.companies),
            vendors: calculateChange(lastMonth.vendors, prevMonth.vendors),
            pending: calculateChange(lastMonth.pending, prevMonth.pending),
        }
      });
    } catch (error) {
      console.error("[AdminStats] Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

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

      const payload = users.map((user) => {
        const company = companyMap.get(String(user._id));
        const vendor = vendorMap.get(String(user._id));
        return {
          ...user,
          companyName: company?.companyName || "",
          fullName: vendor?.fullName || user.fullName || "",
          companyProfile: company || null,
          vendorProfile: vendor || null,
        };
      });

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

      // Notify user via Email and System Notification
      try {
        // Send Email
        await emailService.sendApprovalEmail(user);

        // Send Notification
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
        console.error("Failed to send approval alerts:", notifError);
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
      const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
      const acknowledgeWarnings = Boolean(req.body?.acknowledgeWarnings);

      if (!reason) {
        throw this.createRequestError(400, "Deactivation reason is required.");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw this.createRequestError(404, "User not found");
      }

      if (user.role === "admin") {
        throw this.createRequestError(400, "Administrators cannot be deactivated.");
      }

      const briefing = await this.buildArchiveBriefing(user);

      if (!briefing.canProceed) {
        throw this.createRequestError(
          409,
          "Deactivation is blocked until all money-related conditions are resolved.",
          { briefing }
        );
      }

      if (briefing.warnings.length > 0 && !acknowledgeWarnings) {
        throw this.createRequestError(
          400,
          "Please acknowledge the deactivation warnings before continuing.",
          { briefing }
        );
      }

      // Handle Level 2: Cancel contracts and notify
      const cancelledContracts = await this.cancelLiveContractsForArchive(
        user,
        reason,
        req.user?._id || null
      );
      
      const notificationCount = await this.notifyDeactivateDeleteCounterparties(
        req,
        user,
        cancelledContracts,
        reason,
        "deactivated"
      );

      user.status = "deactivated";
      await user.save();

      // Notify the user themselves
      try {
        const notificationService = getNotificationService(req);
        const payload = {
          recipientId: user._id,
          senderId: req.user?._id || null,
          type: "account_deactivated",
          title: "Account Deactivated",
          message: `Your account has been deactivated by an administrator. Reason: ${reason}. You can submit an appeal to regain access.`,
          priority: "high",
        };
        if (notificationService) {
          await notificationService.createNotification(payload);
        } else {
          await Notification.create(payload);
        }
      } catch (e) {
        console.error("Failed to notify deactivated user:", e);
      }

      return res.json({
        message: "User deactivated successfully",
        user: this.sanitizeUser(user),
        cancelledContractsCount: cancelledContracts.length,
        notificationCount,
      });
    } catch (error) {
      return this.handleRequestError(
        res,
        error,
        "Server error",
        "Deactivate user error:"
      );
    }
  }

  async notifyDeactivateDeleteCounterparties(req, targetUser, cancelledContracts, reason, action) {
    if (!cancelledContracts.length) {
      return 0;
    }

    const notificationService = getNotificationService(req);
    let notificationCount = 0;

    const actionText = action === "deactivated" ? "deactivated" : "deleted";

    for (const contract of cancelledContracts) {
      const recipientId =
        String(contract.companyId) === String(targetUser._id)
          ? contract.vendorId
          : contract.companyId;

      if (!recipientId) {
        continue;
      }

      const payload = {
        recipientId,
        senderId: req.user?._id || null,
        type: "contract_cancelled",
        title: `Account ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
        message: `The ${targetUser.role} you were working with for "${contract.title}" has been ${actionText}. The contract is cancelled. We apologize for the inconvenience; you can find another professional on our platform.`,
        data: {
          contractId: contract._id,
          targetUserId: targetUser._id,
          targetUserRole: targetUser.role,
          action,
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

  async getTaskMonitoring(req, res) {
    try {
      const now = new Date();
      
      const [
        totalTasks,
        statusDist,
        categoryDist,
        creationTrend,
        budgetDist,
        overdueCount
      ] = await Promise.all([
        Task.countDocuments(),
        Task.aggregate([
          { $group: { _id: "$status", value: { $sum: 1 } } }
        ]),
        Task.aggregate([
          { $group: { _id: "$category", value: { $sum: 1 } } },
          { $sort: { value: -1 } }
        ]),
        Task.aggregate([
          {
            $group: {
              _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          { $limit: 12 }
        ]),
        Task.aggregate([
          {
            $bucket: {
              groupBy: "$budget",
              boundaries: [0, 5000, 10000, 50000, 100000, 500000],
              default: "500000+",
              output: { count: { $sum: 1 } }
            }
          }
        ]),
        Task.countDocuments({
          deadline: { $lt: now },
          status: { $ne: "completed" }
        })
      ]);

      // Format trends for area chart
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedTrend = creationTrend.map(item => ({
        name: months[item._id.month - 1],
        tasks: item.count
      }));

      // Format budget distribution for bar chart
      const budgetLabels = {
        0: "0-5k",
        5000: "5k-10k",
        10000: "10k-50k",
        50000: "50k-100k",
        100000: "100k-500k",
        "500000+": "500k+"
      };
      const formattedBudget = budgetDist.map(item => ({
        range: budgetLabels[item._id] || item._id,
        count: item.count
      }));

      // Active vs Completed changes (simulated for now based on total)
      const prevTotal = totalTasks > 0 ? totalTasks - 1 : 0; // Simple fallback
      const calculateChange = (curr, prev) => {
        if (!prev) return 0;
        return (((curr - prev) / prev) * 100).toFixed(1);
      };

      res.json({
        stats: {
          total: totalTasks,
          active: statusDist.find(s => s._id === "in-progress")?.value || 0,
          completed: statusDist.find(s => s._id === "completed")?.value || 0,
          overdue: overdueCount,
          changes: {
            total: calculateChange(totalTasks, prevTotal),
            overdue: 0 // Placeholder
          }
        },
        charts: {
          statusDistribution: statusDist.map(s => ({ name: s._id, value: s.value })),
          categoryDistribution: categoryDist.map(c => ({ name: c._id, value: c.value })),
          creationTrend: formattedTrend,
          budgetDistribution: formattedBudget
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getContractMonitoring(req, res) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [
        totalContracts,
        activeContracts,
        completedContracts,
        totalValue,
        statusDist,
        creationTrend
      ] = await Promise.all([
        Contract.countDocuments(),
        Contract.countDocuments({ status: "active" }),
        Contract.countDocuments({ status: "completed" }),
        Contract.aggregate([
          { $group: { _id: null, total: { $sum: "$totalBudget" } } }
        ]),
        Contract.aggregate([
          { $group: { _id: "$status", value: { $sum: 1 } } }
        ]),
        Contract.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])
      ]);

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedTrend = creationTrend.map(item => ({
        name: months[item._id.month - 1],
        contracts: item.count
      }));

      // Simulate changes for now
      const calculateChange = (curr, prev) => {
        if (!prev) return 0;
        return (((curr - prev) / prev) * 100).toFixed(1);
      };

      res.json({
        stats: {
          total: totalContracts,
          active: activeContracts,
          completed: completedContracts,
          totalValue: totalValue[0]?.total || 0,
          changes: {
            total: calculateChange(totalContracts, totalContracts - 1),
            value: 0
          }
        },
        charts: {
          statusDistribution: statusDist.map(s => ({ name: s._id, value: s.value })),
          creationTrend: formattedTrend
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getGlobalActivity(req, res) {
    try {
      const [users, tasks, contracts, payments] = await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(20).lean(),
        Task.find().sort({ updatedAt: -1 }).limit(20).populate("companyId", "fullName email").lean(),
        Contract.find().sort({ updatedAt: -1 }).limit(20).lean(),
        Payment.find().sort({ updatedAt: -1 }).limit(20).lean()
      ]);

      // Fetch company names separately to ensure accuracy
      const companyIds = tasks.map(t => t.companyId?._id).filter(id => id);
      const companies = await Company.find({ userId: { $in: companyIds } }).select("userId companyName").lean();
      const companyMap = new Map(companies.map(c => [String(c.userId), c.companyName]));

      const activities = [
        ...(users || []).map(u => ({
          id: u._id,
          action: u.status === 'approved' ? `User "${u.fullName || u.email}" verified` : `New user "${u.fullName || u.email}" registered`,
          user: u.fullName || u.email,
          type: "USER",
          status: u.status,
          timestamp: u.createdAt
        })),
        ...(tasks || []).map(t => ({
          id: t._id,
          action: `Task "${t.title}" ${t.status}`,
          user: companyMap.get(String(t.companyId?._id)) || t.companyId?.fullName || "System",
          type: "TASK",
          status: t.status,
          timestamp: t.updatedAt || t.createdAt
        })),
        ...(contracts || []).map(c => ({
          id: c._id,
          action: `Contract "${c.title}" ${c.status}`,
          user: "System",
          type: "CONTRACT",
          status: c.status,
          timestamp: c.updatedAt || c.createdAt
        })),
        ...(payments || []).map(p => ({
          id: p._id,
          action: `Payment of $${p.amount} ${p.status}`,
          user: "Finance",
          type: "PAYMENT",
          status: p.status,
          timestamp: p.updatedAt || p.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);

      res.json({ success: true, data: activities });
    } catch (error) {
      console.error("[AdminActivity] Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async softDeleteUser(req, res) {
    try {
      const { userId } = req.params;
      const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
      const acknowledgeWarnings = Boolean(req.body?.acknowledgeWarnings);

      if (!reason) {
        throw this.createRequestError(400, "Delete reason is required.");
      }

      const user = await this.getArchivableUserOrThrow(userId);
      const briefing = await this.buildArchiveBriefing(user);

      if (!briefing.canProceed) {
        throw this.createRequestError(
          409,
          "Deletion is blocked until all money-related conditions are resolved.",
          { briefing }
        );
      }

      if (briefing.warnings.length > 0 && !acknowledgeWarnings) {
        throw this.createRequestError(
          400,
          "Please acknowledge the deletion warnings before continuing.",
          { briefing }
        );
      }

      const cancelledContracts = await this.cancelLiveContractsForArchive(
        user,
        reason,
        req.user?._id || null
      );
      
      const notificationCount = await this.notifyDeactivateDeleteCounterparties(
        req,
        user,
        cancelledContracts,
        reason,
        "deleted"
      );

      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = req.user?._id || null;
      user.deletionReason = reason;
      await user.save();

      return res.json({
        message: "User deleted successfully",
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
      fullName: user.fullName,
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
        "Only company and vendor accounts can be deleted from user management."
      );
    }

    if (user.isDeleted) {
      throw this.createRequestError(409, "User is already deleted.");
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
        message: `User has ${pendingPayments.length} pending or processing payment(s) that must be resolved before deactivating/deleting.`,
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
        message: `User has ${pendingTransactions.length} pending transaction(s) that must clear before deactivating/deleting.`,
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
        message: `User still has an available wallet balance of ${walletBalance.toFixed(2)} that must be settled before deactivating/deleting.`,
        amount: walletBalance,
      });
    }

    if (lockedBalance > 0) {
      blockers.push({
        code: "locked_wallet_balance",
        message: `User still has ${lockedBalance.toFixed(2)} in locked wallet funds that must be resolved before deactivating/deleting.`,
        amount: lockedBalance,
      });
    }

    const warnings = [];
    if (liveContracts.length > 0) {
      warnings.push({
        code: "live_contracts",
        message: `User is involved in ${liveContracts.length} live contract(s). Continuing will cancel those contracts and notify the other party.`,
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
          currency: wallet?.currency || "USD",
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
        action: "deactivate_delete_user",
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
      const user = await User.findById(userId);
      if (!user) throw this.createRequestError(404, "User not found");
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
        "Permanent delete is disabled for admin user management. Use the soft delete flow instead.",
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

      const payload = users.map((user) => {
        const company = companyMap.get(String(user._id));
        const vendor = vendorMap.get(String(user._id));
        return {
          ...user,
          companyName: company?.companyName || "",
          fullName: vendor?.fullName || user.fullName || "",
          companyProfile: company || null,
          vendorProfile: vendor || null,
        };
      });

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

      // Notify user via Email and System Notification
      try {
        // Send Email
        await emailService.sendApprovalEmail(user);

        // Send Notification
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: user._id,
            senderId: req.user._id,
            type: "user_approved",
            title: "Profile Verified",
            message: "Your profile has been verified and approved!",
            data: { userId: user._id },
            relatedId: user._id,
            relatedModel: "User",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send verification alerts:", notifError);
      }

      return res.json({ message: "Profile approved", user });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getTaskReport(req, res) {
    try {
      const tasks = await Task.find().populate("companyId", "fullName email").lean();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error generating task report", error: error.message });
    }
  }

  async getUserReport(req, res) {
    try {
      const users = await User.find({ isDeleted: false }).select("-passwordHash").lean();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error generating user report", error: error.message });
    }
  }

  async getFinanceReport(req, res) {
    try {
      const payments = await Payment.find().sort({ createdAt: -1 }).lean();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error generating finance report", error: error.message });
    }
  }

  async rejectVerification(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Instead of just setting status to rejected, we set status back to incomplete
      // or keep as rejected but allow them to go back to onboarding.
      // Based on requirement: "be able to change the data and reapply"
      user.status = "rejected";
      user.onboardingStep = 2; // Send them back to step 2 to update info
      user.rejectionReason = reason; // Store reason for user to see
      await user.save();

      // Send Email
      try {
        await emailService.sendRejectionEmail(user.email, user.fullName || user.email, reason);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      // Notify user on platform
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: user._id,
            senderId: req.user._id,
            type: "user_rejected",
            title: "Profile Rejected",
            message: `Your profile application was rejected. Reason: ${reason}. Please update your details and re-apply.`,
            data: { userId: user._id, reason },
            relatedId: user._id,
            relatedModel: "User",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send verification notification:", notifError);
      }

      return res.json({ message: "Profile rejected and user notified", user });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}

const adminController = new AdminController();

module.exports = adminController;
module.exports.AdminController = AdminController;
