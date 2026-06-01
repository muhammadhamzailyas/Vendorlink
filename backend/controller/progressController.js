const Task = require("../model/task");
const Contract = require("../model/Contract");
const ProgressUpdate = require("../model/ProgressUpdate");
const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");
const Payment = require("../model/Payment");
const User = require("../model/user");
const mongoose = require("mongoose");

const getNotificationService = (req) => {
  try {
    return req.app?.get("notificationService");
  } catch {
    return null;
  }
};

// Get vendor's active contracts/tasks
exports.getVendorActiveTasks = async (req, res) => {
  try {
    const vendorId = req.user._id.toString();

    const activeContracts = await Contract.find({
      vendorId,
      status: { $in: ["active", "pending-completion"] },
      companyApproved: true,
      vendorApproved: true,
    })
      .populate({
        path: "taskId",
        select: "title description category companyId",
        populate: { path: "companyId", select: "fullName email" },
      })
      .populate("companyId", "fullName email")
      .lean();

    const tasks = await Promise.all(
      activeContracts
        .filter((c) => c.taskId)
        .map(async (contract) => {
          const latestUpdate = await ProgressUpdate.findOne({
            taskId: contract.taskId._id,
            vendorId,
          })
            .sort({ updateDate: -1 })
            .lean();

          return {
            contractId: contract._id,
            taskId: contract.taskId._id,
            taskTitle: contract.taskId.title,
            taskDescription: contract.taskId.description,
            category: contract.taskId.category,
            budget: contract.totalBudget,
            deadline: contract.projectEndDate,
            companyName: contract.companyId?.fullName,
            companyId: contract.companyId?._id,
            progress: latestUpdate?.percentage || 0,
            currentStatus: latestUpdate?.status || "in-progress",
            lastUpdated: latestUpdate?.updateDate || contract.activatedAt,
            activatedAt: contract.activatedAt,
          };
        })
    );

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching vendor active tasks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get task progress details (vendor)
exports.getTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const vendorId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, error: "Invalid task ID format" });
    }

    const contract = await Contract.findOne({ taskId, vendorId });
    if (!contract) {
      return res.status(403).json({ success: false, error: "Access denied - No contract found" });
    }

    const task = await Task.findById(taskId).populate("companyId", "fullName email");
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const progressUpdates = await ProgressUpdate.find({ taskId, vendorId })
      .sort({ updateDate: -1 })
      .lean();

    const latestUpdate = progressUpdates[0] || null;

    res.json({
      success: true,
      data: {
        task,
        contract,
        progressUpdates,
        currentProgress: latestUpdate?.percentage || 0,
        currentStatus: latestUpdate?.status || "in-progress",
      },
    });
  } catch (error) {
    console.error("Error fetching task progress:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add/Update progress update
exports.addProgressUpdate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const vendorId = req.user._id.toString();
    const { updateDate, comment, status, percentage } = req.body;

    if (!updateDate) return res.status(400).json({ success: false, error: "Update date is required" });
    if (!comment || !comment.trim()) return res.status(400).json({ success: false, error: "Comment is required" });
    if (percentage === undefined || percentage === null) {
      return res.status(400).json({ success: false, error: "Progress percentage is required" });
    }
    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return res.status(400).json({ success: false, error: "Percentage must be a number between 0 and 100" });
    }

    const contract = await Contract.findOne({ taskId, vendorId, status: "active" })
      .populate("companyId", "fullName");
    if (!contract) {
      return res.status(403).json({ success: false, error: "Access denied or task not active" });
    }

    const formattedDate = new Date(updateDate);
    formattedDate.setHours(0, 0, 0, 0);

    const existingUpdate = await ProgressUpdate.findOne({
      taskId,
      vendorId,
      updateDate: {
        $gte: formattedDate,
        $lt: new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    let progressUpdate;
    if (existingUpdate) {
      existingUpdate.comment = comment.trim();
      existingUpdate.status = status || existingUpdate.status;
      existingUpdate.percentage = percentage;
      existingUpdate.updatedAt = new Date();
      await existingUpdate.save();
      progressUpdate = existingUpdate;
    } else {
      progressUpdate = new ProgressUpdate({
        taskId,
        vendorId,
        companyId: contract.companyId._id || contract.companyId,
        updateDate: formattedDate,
        comment: comment.trim(),
        status: status || "in-progress",
        percentage,
      });
      await progressUpdate.save();
    }

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        const task = await Task.findById(taskId);
        await notificationService.createNotification({
          recipientId: contract.companyId._id || contract.companyId,
          senderId: vendorId,
          type: "progress_updated",
          title: "Progress Update",
          message: `${req.user.fullName} updated progress to ${percentage}% on "${task?.title || "your task"}"`,
          data: {
            taskId,
            taskTitle: task?.title,
            progressPercentage: percentage,
            status: status || "in-progress",
            updateId: progressUpdate._id,
            role: "company",
          },
          relatedId: taskId,
          relatedModel: "Task",
          priority: "medium",
        });
      } catch (notifError) {
        console.error("Failed to send progress notification:", notifError);
      }
    }

    res.status(201).json({
      success: true,
      message: existingUpdate ? "Progress update updated" : "Progress update added",
      data: progressUpdate,
    });
  } catch (error) {
    console.error("Error adding progress update:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get company's active contracts/tasks
exports.getCompanyActiveTasks = async (req, res) => {
  try {
    const companyId = req.user._id.toString();

    const activeContracts = await Contract.find({
      companyId,
      status: { $in: ["active", "pending-completion"] },
      companyApproved: true,
      vendorApproved: true,
    })
      .populate({ path: "taskId", select: "title description category" })
      .populate("vendorId", "fullName email")
      .lean();

    const tasks = await Promise.all(
      activeContracts
        .filter((c) => c.taskId)
        .map(async (contract) => {
          const latestUpdate = await ProgressUpdate.findOne({
            taskId: contract.taskId._id,
            vendorId: contract.vendorId._id,
          })
            .sort({ updateDate: -1 })
            .lean();

          const updatesCount = await ProgressUpdate.countDocuments({
            taskId: contract.taskId._id,
            vendorId: contract.vendorId._id,
          });

          return {
            contractId: contract._id,
            taskId: contract.taskId._id,
            taskTitle: contract.taskId.title,
            taskDescription: contract.taskId.description,
            category: contract.taskId.category,
            budget: contract.totalBudget,
            deadline: contract.projectEndDate,
            vendorName: contract.vendorId?.fullName || "Vendor",
            vendorEmail: contract.vendorId?.email,
            vendorId: contract.vendorId?._id,
            progress: latestUpdate?.percentage || 0,
            currentStatus: latestUpdate?.status || "in-progress",
            contractStatus: contract.status,
            lastUpdated: latestUpdate?.updateDate || contract.activatedAt,
            activatedAt: contract.activatedAt,
            updatesCount,
          };
        })
    );

    const stats = {
      total: tasks.length,
      inProgress: tasks.filter((t) => t.currentStatus === "in-progress").length,
      completed: tasks.filter((t) => t.currentStatus === "completed").length,
      blocked: tasks.filter((t) => t.currentStatus === "blocked").length,
      review: tasks.filter((t) => t.currentStatus === "review").length,
      onHold: tasks.filter((t) => t.currentStatus === "on-hold").length,
      averageProgress: tasks.length > 0
        ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
        : 0,
    };

    res.json({ success: true, data: tasks, stats });
  } catch (error) {
    console.error("Error fetching company active tasks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get task progress details for company
exports.getCompanyTaskProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, error: "Invalid task ID format" });
    }

    const contract = await Contract.findOne({ 
      taskId, 
      companyId, 
      status: { $in: ["active", "pending-completion", "completed"] } 
    })
      .populate("vendorId", "fullName email profileImage")
      .populate("taskId");

    if (!contract) {
      return res.status(403).json({ success: false, error: "Access denied - No relevant contract found" });
    }

    const progressUpdates = await ProgressUpdate.find({
      taskId,
      vendorId: contract.vendorId._id,
    })
      .sort({ updateDate: -1 })
      .lean();

    const stats = {
      totalUpdates: progressUpdates.length,
      averageProgress: progressUpdates.length > 0
        ? Math.round(progressUpdates.reduce((acc, u) => acc + u.percentage, 0) / progressUpdates.length)
        : 0,
      statusDistribution: {
        "in-progress": progressUpdates.filter((u) => u.status === "in-progress").length,
        completed: progressUpdates.filter((u) => u.status === "completed").length,
        blocked: progressUpdates.filter((u) => u.status === "blocked").length,
        review: progressUpdates.filter((u) => u.status === "review").length,
        "on-hold": progressUpdates.filter((u) => u.status === "on-hold").length,
      },
      lastUpdate: progressUpdates[0] || null,
      firstUpdate: progressUpdates[progressUpdates.length - 1] || null,
    };

    res.json({
      success: true,
      data: {
        task: contract.taskId,
        contract: contract, // Return full contract object to include status
        vendor: contract.vendorId,
        progressUpdates,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching company task progress:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get progress history for company
exports.getCompanyProgressHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, companyId });
    if (!contract) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const progressUpdates = await ProgressUpdate.find({ taskId, vendorId: contract.vendorId })
      .sort({ updateDate: -1 })
      .lean();

    res.json({ success: true, data: progressUpdates });
  } catch (error) {
    console.error("Error fetching progress history:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export progress report
exports.exportProgressReport = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, companyId })
      .populate("vendorId", "fullName email")
      .populate("taskId");

    if (!contract) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const progressUpdates = await ProgressUpdate.find({
      taskId,
      vendorId: contract.vendorId._id,
    }).sort({ updateDate: -1 });

    res.json({
      success: true,
      message: "Export functionality coming soon",
      data: { task: contract.taskId, vendor: contract.vendorId, progressUpdates },
    });
  } catch (error) {
    console.error("Error exporting progress report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Request project completion (Vendor)
exports.requestProjectCompletion = async (req, res) => {
  try {
    const { taskId } = req.params;
    const vendorId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, vendorId, status: "active" });
    if (!contract) {
      return res.status(403).json({ success: false, error: "Active contract not found" });
    }

    contract.status = "pending-completion";
    await contract.save();

    // Also add a 100% progress update if not exists
    const latestUpdate = await ProgressUpdate.findOne({ taskId, vendorId }).sort({ updateDate: -1 });
    if (!latestUpdate || latestUpdate.percentage < 100) {
      const completionUpdate = new ProgressUpdate({
        taskId,
        vendorId,
        companyId: contract.companyId,
        updateDate: new Date(),
        comment: "Project completed and submitted for review.",
        status: "completed",
        percentage: 100,
      });
      await completionUpdate.save();
    }

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: contract.companyId,
          senderId: vendorId,
          type: "completion_requested",
          title: "Project Completion Request",
          message: `${req.user.fullName} has marked the project "${contract.title}" as completed. Please review and approve.`,
          data: { taskId, contractId: contract._id, role: "company" },
          relatedId: taskId,
          relatedModel: "Task",
        });
      } catch (e) { console.error(e); }
    }

    res.json({ success: true, message: "Completion request submitted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get project payment readiness summary (Company)
exports.getPaymentReadiness = async (req, res) => {
  try {
    const { taskId } = req.params;
    const companyId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, companyId });
    if (!contract) return res.status(404).json({ success: false, error: "Contract not found" });

    const wallet = await Wallet.findOne({ userId: companyId });
    const totalPaid = contract.totalPaid || 0;
    const remainingAmount = contract.totalBudget - totalPaid;
    const companyBalance = wallet?.balance || 0;

    res.json({
      success: true,
      data: {
        totalBudget: contract.totalBudget,
        totalPaid,
        remainingAmount,
        companyBalance,
        isReady: companyBalance >= remainingAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get project payment summary (Role aware)
exports.getPaymentSummary = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, $or: [{ companyId: userId }, { vendorId: userId }] });
    if (!contract) return res.status(404).json({ success: false, error: "Contract not found" });

    const payment = await Payment.findOne({ contractId: contract._id, status: "completed" }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        amount: payment?.amount || 0,
        vendorAmount: payment?.vendorAmount || 0,
        platformFee: payment?.platformFee || 0,
        paymentDate: payment?.paymentDate,
        invoiceNumber: payment?.invoiceNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve project completion (Company)
exports.approveProjectCompletion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { taskId } = req.params;
    const companyId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, companyId, status: "pending-completion" })
      .populate("vendorId");
    if (!contract) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: "Pending completion contract not found" });
    }

    const totalAmount = contract.totalBudget;
    const totalPaid = contract.totalPaid || 0;
    const remainingAmount = totalAmount - totalPaid;

    // Create unique invoice number: VL-YYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
    const invoiceNumber = `VL-${dateStr}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

    if (remainingAmount > 0) {
      // Check company wallet
      const companyWallet = await Wallet.findOne({ userId: companyId }).session(session);
      if (!companyWallet || companyWallet.balance < remainingAmount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, error: `Insufficient wallet balance. You need $${remainingAmount} to complete this project.` });
      }

      // Perform automatic payment
      const platformFee = (remainingAmount * 5) / 100; // 5% fee
      const vendorAmount = remainingAmount - platformFee;

      // Deduct from company
      companyWallet.balance -= remainingAmount;
      companyWallet.lastTransactionAt = new Date();
      await companyWallet.save();

      // Add to vendor
      const vendorWallet = await Wallet.findOneAndUpdate(
        { userId: contract.vendorId._id },
        { 
          $inc: { balance: vendorAmount, totalReceived: vendorAmount },
          $set: { lastTransactionAt: new Date() }
        },
        { upsert: true, new: true, session }
      );

      // Create Payment record
      const payment = new Payment({
        taskId: contract.taskId,
        contractId: contract._id,
        companyId,
        vendorId: contract.vendorId._id,
        amount: remainingAmount,
        originalAmount: totalAmount,
        platformFee,
        vendorAmount,
        paymentType: "full",
        status: "completed",
        invoiceNumber,
        notes: "Automatic payment upon project completion approval.",
        createdBy: companyId,
        paymentDate: new Date(),
        vendorConfirmed: true,
        vendorConfirmedAt: new Date(),
      });
      await payment.save({ session });

      // Create Transaction record
      const transaction = new Transaction({
        fromUserId: companyId,
        toUserId: contract.vendorId._id,
        amount: remainingAmount,
        platformFee,
        netAmount: vendorAmount,
        type: "payment",
        status: "completed",
        paymentMethod: "wallet_balance",
        taskId: contract.taskId,
        contractId: contract._id,
        paymentId: payment._id,
        description: `Final payment for ${contract.title}`,
        completedAt: new Date(),
        fromBalanceAfter: companyWallet.balance,
        toBalanceAfter: vendorWallet.balance,
      });
      await transaction.save({ session });

      contract.totalPaid = totalAmount;
    }

    contract.status = "completed";
    contract.updatedAt = new Date();
    await contract.save({ session });

    // Update Task status
    await Task.findByIdAndUpdate(taskId, { status: "completed" }).session(session);

    await session.commitTransaction();
    session.endSession();

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: contract.vendorId._id,
          senderId: companyId,
          type: "completion_approved",
          title: "Project Completed",
          message: `Company has approved completion of "${contract.title}". Final payment has been credited to your wallet.`,
          data: { taskId, contractId: contract._id, role: "vendor" },
          relatedId: taskId,
          relatedModel: "Task",
        });
      } catch (e) { console.error(e); }
    }

    res.json({ success: true, message: "Project completion approved and payment processed.", data: { invoiceNumber } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error approving completion:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get progress history (vendor)
exports.getProgressHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const vendorId = req.user._id.toString();

    const contract = await Contract.findOne({ taskId, vendorId });
    if (!contract) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const progressUpdates = await ProgressUpdate.find({ taskId, vendorId })
      .sort({ updateDate: -1 })
      .lean();

    res.json({ success: true, data: progressUpdates });
  } catch (error) {
    console.error("Error fetching progress history:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
