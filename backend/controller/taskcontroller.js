const Task = require("../model/task");
const Proposal = require("../model/proposal");
const User = require("../model/user");
const Contract = require("../model/Contract");
const Payment = require("../model/Payment");

const getNotificationService = (req) => {
  try { return req.app?.get("notificationService"); } catch { return null; }
};

class TaskController {
  // Create Task
  async createTask(req, res) {
    try {
      const { 
        title, 
        description, 
        requirements, 
        budget, 
        deadline, 
        category, 
        skills, 
        priority, 
        taskType,
        complexity,
        duration
      } = req.body;

      if (
        !title ||
        !description ||
        !requirements ||
        !budget ||
        !deadline ||
        !category
      ) {
        return res.status(400).json({ error: "Required fields are missing (Title, Description, Requirements, Budget, Deadline, Category)" });
      }

      if (new Date(deadline) <= new Date()) {
        return res
          .status(400)
          .json({ error: "Deadline must be in the future not past" });
      }

      const task = new Task({
        title,
        description,
        requirements,
        budget,
        deadline,
        category,
        skills: Array.isArray(skills) ? skills : [],
        priority: priority || "medium",
        taskType: taskType || "fixed-price",
        complexity: complexity || "intermediate",
        duration: duration || "1-3-months",
        companyId: req.user._id,
      });

      await task.save();

      res.status(201).json({ message: "Task added successfully", taskId: task._id });

      // Notify admins and all vendors about new task
      try {
        const notificationService = getNotificationService(req);
        if (notificationService) {
          // Notify Vendors
          const vendors = await User.find({ role: "vendor", status: "approved" }).select("_id");
          for (const vendor of vendors) {
            await notificationService.createNotification({
              recipientId: vendor._id,
              senderId: req.user._id,
              type: "task_created",
              title: "New Task Available",
              message: `New task "${title}" in ${category} is now available.`,
              data: { taskId: task._id, taskTitle: title, category },
              relatedId: task._id,
              relatedModel: "Task",
              priority: "medium",
            });
          }

          // Notify Admins
          const admins = await User.find({ role: "admin" }).select("_id");
          for (const admin of admins) {
            await notificationService.createNotification({
              recipientId: admin._id,
              senderId: req.user._id,
              type: "task_created_admin",
              title: "Task Posted",
              message: `A new task "${title}" has been posted by ${req.user.fullName || 'a company'}.`,
              data: { taskId: task._id, taskTitle: title },
              relatedId: task._id,
              relatedModel: "Task",
              priority: "low",
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to send task notification:", notifError);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get tasks created by company
  async getCompanyTasks(req, res) {
    try {
      const tasks = await Task.find({ companyId: req.user._id }).sort({
        createdAt: -1,
      });

      // Augment tasks with contract status
      const augmentedTasks = await Promise.all(tasks.map(async (task) => {
        const contract = await Contract.findOne({ taskId: task._id });
        return {
          ...task.toObject(),
          contractStatus: contract?.status || null,
        };
      }));

      res.json(augmentedTasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Vendor sees available tasks
  async getVendorTasks(req, res) {
    try {
      const tasks = await Task.find({
        companyId: { $ne: req.user._id },
        status: "open",
      }).sort({ createdAt: -1 });

      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get single task
  async getTaskById(req, res) {
    try {
      const task = await Task.findById(req.params.id)
        .populate("companyId", "companyName fullName email")
        .populate("selectedVendor", "fullName email");

      if (!task) return res.status(404).json({ error: "Task not found" });

      res.json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Check deletability
  async checkDeletability(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.findOne({ _id: id, companyId: req.user._id });
      if (!task) return res.status(404).json({ error: "Task not found" });

      // Level 1: Simple confirmation (Open, no accepted proposal)
      const acceptedProposal = await Proposal.findOne({ taskId: id, status: "accepted" });
      
      if (!acceptedProposal) {
        return res.json({
          canDelete: true,
          level: 1,
          message: "Are you sure you want to delete this task? This action cannot be undone.",
          warning: null
        });
      }

      // Check for Level 3: Transaction phase
      const Contract = require("../model/Contract");
      const contract = await Contract.findOne({ taskId: id });
      
      // If contract exists and has any payments
      const Payment = require("../model/Payment");
      const payments = await Payment.find({ taskId: id });
      
      if (payments.length > 0) {
        return res.json({
          canDelete: false,
          level: 3,
          message: "This task is in the transaction phase and cannot be deleted.",
          warning: "Payments have already been processed or are pending for this task. Please complete or dispute the task through formal channels."
        });
      }

      // Level 2: Warning (Has accepted proposal/active contract but no payments)
      return res.json({
        canDelete: true,
        level: 2,
        message: "Warning: This task is currently being worked on by a vendor.",
        warning: "A vendor has already been assigned to this task. Deleting it now will cancel their engagement and they must be informed. Are you sure you want to proceed?"
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Delete task
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.findOne({ _id: id, companyId: req.user._id });

      if (!task) return res.status(404).json({ error: "Task not found" });

      // Verify deletability again before actual delete
      const Payment = require("../model/Payment");
      const payments = await Payment.countDocuments({ taskId: id });
      if (payments > 0) {
        return res.status(400).json({ error: "Cannot delete task in transaction phase" });
      }

      // Handle contract cancellation if exists
      const Contract = require("../model/Contract");
      const contract = await Contract.findOne({ taskId: id });
      if (contract) {
        contract.status = "cancelled";
        contract.cancelledAt = new Date();
        contract.cancellationReason = "Task deleted by company";
        await contract.save();
      }

      await Proposal.deleteMany({ taskId: id });
      await Task.findByIdAndDelete(id);

      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Update task (Company only)
  async updateTask(req, res) {
    try {
      const task = await Task.findOne({ _id: req.params.id, companyId: req.user._id });
      if (!task) return res.status(404).json({ error: "Task not found or not authorized" });

      if (task.status !== "open") {
        return res.status(400).json({ error: "Can only update open tasks" });
      }

      const allowedUpdates = ["title", "description", "requirements", "budget", "deadline", "category"];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });
      await task.save();

      res.json({ message: "Task updated", task });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Complete task (Company only)
  async completeTask(req, res) {
    try {
      const task = await Task.findOne({ _id: req.params.id, companyId: req.user._id });
      if (!task) return res.status(404).json({ error: "Task not found or not authorized" });

      if (task.status !== "in-progress") {
        return res.status(400).json({ error: "Only in-progress tasks can be completed" });
      }

      task.status = "completed";
      task.completedAt = new Date();
      await task.save();

      // Automatically complete the associated contract
      const contract = await Contract.findOne({ taskId: task._id });
      if (contract) {
        contract.status = "completed";
        contract.completedAt = new Date();
        await contract.save();

        // Automatically transfer remaining balance from company to vendor
        if (contract.totalBudget > contract.totalPaid) {
          const remainingAmount = contract.totalBudget - (contract.totalPaid || 0);
          
          // Implementation for automatic payment transfer
          const Wallet = require("../model/Wallet");
          const companyWallet = await Wallet.findOne({ userId: task.companyId });
          const vendorWallet = await Wallet.findOne({ userId: task.selectedVendor });

          if (companyWallet && vendorWallet && companyWallet.balance >= remainingAmount) {
            companyWallet.balance -= remainingAmount;
            vendorWallet.balance += remainingAmount;
            
            await companyWallet.save();
            await vendorWallet.save();

            // Record the payment
            const payment = new Payment({
              contractId: contract._id,
              taskId: task._id,
              amount: remainingAmount,
              paymentType: "milestone",
              status: "completed",
              senderId: task.companyId,
              recipientId: task.selectedVendor,
            });
            await payment.save();
          }
        }
      }

      res.json({ message: "Task and contract completed successfully", task });

      // Notify vendor
      try {
        const notificationService = getNotificationService(req);
        if (notificationService && task.selectedVendor) {
          await notificationService.createNotification({
            recipientId: task.selectedVendor,
            senderId: req.user._id,
            type: "task_completed",
            title: "Task Completed",
            message: `Task "${task.title}" has been marked as completed. Payment has been transferred.`,
            data: { taskId: task._id, taskTitle: task.title },
            relatedId: task._id,
            relatedModel: "Task",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send complete notification:", notifError);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Get all tasks (Admin only)
  async getAllTasks(req, res) {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const tasks = await Task.find()
        .populate("companyId", "companyName fullName email")
        .sort({ createdAt: -1 });

      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new TaskController();
