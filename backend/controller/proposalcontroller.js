const Proposal = require("../model/proposal");
const Task = require("../model/task");
const User = require("../model/user");

const getNotificationService = (req) => {
  try { return req.app?.get("notificationService"); } catch { return null; }
};

class ProposalController {
  // Create Proposal
  async createProposal(req, res) {
    try {
      if (req.user.role !== "vendor") {
        return res
          .status(403)
          .json({ error: "Only vendors can submit proposals" });
      }

      const task = await Task.findById(req.body.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (task.status !== "open") {
        return res
          .status(400)
          .json({ error: "Task is not accepting proposals" });
      }

      if (new Date(req.body.proposedDeadline) > new Date(task.deadline)) {
        return res
          .status(400)
          .json({ error: "Proposed deadline cannot exceed task deadline" });
      }

      const exists = await Proposal.findOne({
        taskId: req.body.taskId,
        vendorId: req.user._id,
      });

      if (exists) {
        return res
          .status(400)
          .json({ error: "Proposal already submitted for this task" });
      }

      if (new Date(req.body.proposedDeadline) < new Date()) {
        return res
          .status(400)
          .json({ error: "Proposed deadline must be in the future" });
      }

      if (req.body.bidAmount <= 0) {
        return res
          .status(400)
          .json({ error: "Bid amount must be greater than 0" });
      }

      const proposal = await Proposal.create({
        ...req.body,
        vendorId: req.user._id,
        status: "submitted",
        submittedAt: new Date(),
      });

      const data = await Proposal.findById(proposal._id)
        .populate("vendorId", "username email vendorType")
        .populate("companyId", "companyName username")
        .populate("taskId", "title budget deadline category");

      res.status(201).json({
        message: "Proposal submitted successfully",
        proposal: data,
      });

      // Notify company about new proposal
      try {
        const notificationService = getNotificationService(req);
        if (notificationService && task.companyId) {
          await notificationService.createNotification({
            recipientId: task.companyId,
            senderId: req.user._id,
            type: "proposal_submitted",
            title: "New Proposal Received",
            message: `${req.user.username} submitted a proposal for "${task.title}"`,
            data: { proposalId: proposal._id, taskId: task._id, taskTitle: task.title },
            relatedId: proposal._id,
            relatedModel: "Proposal",
            priority: "medium",
          });
        }
      } catch (notifError) {
        console.error("Failed to send proposal notification:", notifError);
      }
    } catch (err) {
      console.error("Proposal creation error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  // Vendor's Proposals
  async getVendorProposals(req, res) {
    try {
      const data = await Proposal.find({ vendorId: req.user._id })
        .populate("taskId", "title budget deadline status category")
        .populate("companyId", "companyName username email")
        .sort({ submittedAt: -1 });

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Company's Proposals
  async getCompanyProposals(req, res) {
    try {
      const tasks = await Task.find({ companyId: req.user._id });
      const ids = tasks.map((t) => t._id);

      const data = await Proposal.find({ taskId: { $in: ids } })
        .populate("taskId", "title budget deadline status")
        .populate("vendorId", "username email vendorType description")
        .sort({ submittedAt: -1 });

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Proposals for a Task
  async getTaskProposals(req, res) {
    try {
      const data = await Proposal.find({ taskId: req.params.taskId })
        .populate("vendorId", "username email vendorType description")
        .populate("companyId", "companyName username")
        .populate("taskId", "title budget deadline status companyId")
        .sort({ submittedAt: -1 });

      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Generic Status Update
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (status === "accepted") return this.acceptProposal(req, res);
      if (status === "rejected") return this.rejectProposal(req, res);
      
      const p = await Proposal.findById(req.params.id);
      if (!p) return res.status(404).json({ error: "Not found" });
      
      p.status = status;
      await p.save();
      res.json({ message: `Status updated to ${status}`, proposal: p });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Accept Proposal (Company)
  async acceptProposal(req, res) {
    try {
      if (req.user.role !== "company")
        return res.status(403).json({ error: "Company only" });

      const p = await Proposal.findById(req.params.id)
        .populate("taskId")
        .populate("vendorId", "username email");

      if (!p) return res.status(404).json({ error: "Not found" });

      if (p.taskId.companyId.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized" });

      p.status = "accepted";
      p.acceptedAt = new Date();
      await p.save();

      const task = await Task.findByIdAndUpdate(
        p.taskId._id,
        {
          selectedVendor: p.vendorId._id,
          status: "in-progress",
        },
        { new: true }
      ).populate("selectedVendor", "username email");

      await Proposal.updateMany(
        { taskId: p.taskId._id, _id: { $ne: p._id }, status: "submitted" },
        { status: "rejected", rejectedAt: new Date() }
      );

      res.json({ message: "Accepted", proposal: p, task });

      // Notify accepted vendor
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: p.vendorId._id,
            senderId: req.user._id,
            type: "proposal_accepted",
            title: "Proposal Accepted!",
            message: `Your proposal for "${p.taskId.title}" has been accepted!`,
            data: { proposalId: p._id, taskId: p.taskId._id, taskTitle: p.taskId.title },
            relatedId: p._id,
            relatedModel: "Proposal",
            priority: "high",
          });

          // Notify rejected vendors
          const rejectedProposals = await Proposal.find({
            taskId: p.taskId._id,
            _id: { $ne: p._id },
            status: "rejected",
          });
          for (const rp of rejectedProposals) {
            await notificationService.createNotification({
              recipientId: rp.vendorId,
              senderId: req.user._id,
              type: "proposal_rejected",
              title: "Proposal Not Selected",
              message: `Another vendor was selected for "${p.taskId.title}".`,
              data: { proposalId: rp._id, taskId: p.taskId._id, taskTitle: p.taskId.title },
              relatedId: rp._id,
              relatedModel: "Proposal",
              priority: "low",
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to send accept notification:", notifError);
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // Reject Proposal (Company)
  async rejectProposal(req, res) {
    try {
      if (req.user.role !== "company")
        return res.status(403).json({ error: "Company only" });

      const p = await Proposal.findById(req.params.id);
      if (!p) return res.status(404).json({ error: "Not found" });

      const task = await Task.findOne({
        _id: p.taskId,
        companyId: req.user._id,
      });

      if (!task) return res.status(403).json({ error: "Not authorized" });

      p.status = "rejected";
      p.rejectedAt = new Date();
      await p.save();

      res.json({ message: "Rejected", proposal: p });

      // Notify vendor about rejection
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: p.vendorId,
            senderId: req.user._id,
            type: "proposal_rejected",
            title: "Proposal Rejected",
            message: `Your proposal for "${task.title}" has been rejected.`,
            data: { proposalId: p._id, taskId: task._id, taskTitle: task.title },
            relatedId: p._id,
            relatedModel: "Proposal",
            priority: "medium",
          });
        }
      } catch (notifError) {
        console.error("Failed to send reject notification:", notifError);
      }
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
  // Update Proposal (Vendor - only if still submitted)
  async updateProposal(req, res) {
    try {
      if (req.user.role !== "vendor")
        return res.status(403).json({ error: "Vendor only" });

      const proposal = await Proposal.findById(req.params.id);
      if (!proposal) return res.status(404).json({ error: "Not found" });
      if (proposal.vendorId.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized" });
      if (proposal.status !== "submitted")
        return res.status(400).json({ error: "Can only update submitted proposals" });

      const allowedUpdates = ["proposalText", "bidAmount", "proposedDeadline", "skills", "experience", "milestones"];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) proposal[field] = req.body[field];
      });
      await proposal.save();

      const data = await Proposal.findById(proposal._id)
        .populate("vendorId", "username email")
        .populate("taskId", "title budget deadline category");

      res.json({ message: "Proposal updated", proposal: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Delete Proposal (Vendor - only if still submitted)
  async deleteProposal(req, res) {
    try {
      if (req.user.role !== "vendor")
        return res.status(403).json({ error: "Vendor only" });

      const proposal = await Proposal.findById(req.params.id).populate("taskId", "title companyId");
      if (!proposal) return res.status(404).json({ error: "Not found" });
      if (proposal.vendorId.toString() !== req.user._id.toString())
        return res.status(403).json({ error: "Not authorized" });
      if (proposal.status !== "submitted")
        return res.status(400).json({ error: "Can only delete submitted proposals" });

      await Proposal.findByIdAndDelete(req.params.id);

      res.json({ message: "Proposal deleted" });

      // Notify company
      try {
        const notificationService = getNotificationService(req);
        if (notificationService && proposal.taskId?.companyId) {
          await notificationService.createNotification({
            recipientId: proposal.taskId.companyId,
            senderId: req.user._id,
            type: "proposal_withdrawn",
            title: "Proposal Withdrawn",
            message: `${req.user.username} withdrew their proposal for "${proposal.taskId.title}"`,
            data: { taskId: proposal.taskId._id, taskTitle: proposal.taskId.title },
            relatedId: proposal.taskId._id,
            relatedModel: "Task",
            priority: "low",
          });
        }
      } catch (notifError) {
        console.error("Failed to send delete notification:", notifError);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ProposalController();
