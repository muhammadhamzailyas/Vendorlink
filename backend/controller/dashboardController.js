const Task = require("../model/task");
const Proposal = require("../model/proposal");
const Contract = require("../model/Contract");
const Payment = require("../model/Payment");
const dayjs = require("dayjs");

class DashboardController {
  async getStats(req, res) {
    try {
      const userId = req.user._id;
      const role = req.user.role;
      
      const now = dayjs();
      const periodStart = now.subtract(7, "day").toDate();
      const prevPeriodStart = now.subtract(14, "day").toDate();

      if (role === "company") {
        return this.getCompanyStats(userId, periodStart, prevPeriodStart, res);
      } else if (role === "vendor") {
        return this.getVendorStats(userId, periodStart, prevPeriodStart, res);
      } else {
        return res.status(403).json({ error: "Unauthorized role" });
      }
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async getCompanyStats(userId, periodStart, prevPeriodStart, res) {
    // Current period
    const totalTasks = await Task.countDocuments({ companyId: userId });
    const activeContracts = await Contract.countDocuments({ companyId: userId, status: "active" });
    const completedTasks = await Task.countDocuments({ companyId: userId, status: "completed" });
    
    // To get total proposals for this company's tasks
    const companyTasks = await Task.find({ companyId: userId }).select("_id");
    const taskIds = companyTasks.map(t => t._id);
    const totalProposals = await Proposal.countDocuments({ taskId: { $in: taskIds } });

    // Previous period for changes
    const prevTasks = await Task.countDocuments({ companyId: userId, createdAt: { $lt: periodStart, $gte: prevPeriodStart } });
    const prevActive = await Contract.countDocuments({ companyId: userId, status: "active", createdAt: { $lt: periodStart, $gte: prevPeriodStart } });
    const prevCompleted = await Task.countDocuments({ companyId: userId, status: "completed", completedAt: { $lt: periodStart, $gte: prevPeriodStart } });
    const prevProposals = await Proposal.countDocuments({ taskId: { $in: taskIds }, createdAt: { $lt: periodStart, $gte: prevPeriodStart } });

    const computeChange = (current, prev) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - prev) / prev) * 100 * 10) / 10;
    };

    res.json({
      stats: {
        totalTasks,
        totalProposals,
        activeContracts,
        completedTasks
      },
      changes: {
        tasks: computeChange(totalTasks, prevTasks),
        proposals: computeChange(totalProposals, prevProposals),
        active: computeChange(activeContracts, prevActive),
        completed: computeChange(completedTasks, prevCompleted)
      }
    });
  }

  async getVendorStats(userId, periodStart, prevPeriodStart, res) {
    const totalProposals = await Proposal.countDocuments({ vendorId: userId });
    const acceptedProposals = await Proposal.countDocuments({ vendorId: userId, status: "accepted" });
    const activeContracts = await Contract.countDocuments({ vendorId: userId, status: "active" });
    
    // Earnings
    const payments = await Payment.find({ recipientId: userId, status: "completed" });
    const totalEarned = payments.reduce((sum, p) => sum + p.amount, 0);

    // Previous period
    const prevProposals = await Proposal.countDocuments({ vendorId: userId, createdAt: { $lt: periodStart, $gte: prevPeriodStart } });
    const prevAccepted = await Proposal.countDocuments({ vendorId: userId, status: "accepted", acceptedAt: { $lt: periodStart, $gte: prevPeriodStart } });
    const prevActive = await Contract.countDocuments({ vendorId: userId, status: "active", createdAt: { $lt: periodStart, $gte: prevPeriodStart } });
    
    const prevPayments = await Payment.find({ 
        recipientId: userId, 
        status: "completed",
        createdAt: { $lt: periodStart, $gte: prevPeriodStart } 
    });
    const prevEarned = prevPayments.reduce((sum, p) => sum + p.amount, 0);

    const computeChange = (current, prev) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - prev) / prev) * 100 * 10) / 10;
    };

    res.json({
      stats: {
        totalProposals,
        acceptedProposals,
        activeContracts,
        totalEarned
      },
      changes: {
        proposals: computeChange(totalProposals, prevProposals),
        accepted: computeChange(acceptedProposals, prevAccepted),
        active: computeChange(activeContracts, prevActive),
        earnings: computeChange(totalEarned, prevEarned)
      }
    });
  }
}

module.exports = new DashboardController();
