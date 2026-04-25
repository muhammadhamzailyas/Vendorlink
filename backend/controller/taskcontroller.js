const Task = require("../model/task");
const Proposal = require("../model/proposal");
const User = require("../model/user");

const getNotificationService = (req) => {
  try { return req.app?.get("notificationService"); } catch { return null; }
};

class TaskController {
  // Create Task
  async createTask(req, res) {
    try {
      const { title, description, requirements, budget, deadline, category, skills, priority, taskType } =
        req.body;

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
              message: `A new task "${title}" has been posted by ${req.user.username || 'a company'}.`,
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
      res.json(tasks);
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
        .populate("companyId", "companyName username email")
        .populate("selectedVendor", "username email");

      if (!task) return res.status(404).json({ error: "Task not found" });

      res.json(task);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }


  // Delete task
  async deleteTask(req, res) {
    try {
      const task = await Task.findOne({
        _id: req.params.id,
        companyId: req.user._id,
      });

      if (!task)
        return res
          .status(404)
          .json({ error: "Task not found or not authorized" });

      const accepted = await Proposal.findOne({
        taskId: req.params.id,
        status: "accepted",
      });

      if (accepted) {
        return res
          .status(400)
          .json({ error: "Cannot delete task with accepted proposals" });
      }

      await Proposal.deleteMany({ taskId: req.params.id });
      await Task.findByIdAndDelete(req.params.id);

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

      res.json({ message: "Task completed", task });

      // Notify vendor
      try {
        const notificationService = getNotificationService(req);
        if (notificationService && task.selectedVendor) {
          await notificationService.createNotification({
            recipientId: task.selectedVendor,
            senderId: req.user._id,
            type: "task_completed",
            title: "Task Completed",
            message: `Task "${task.title}" has been marked as completed.`,
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
        .populate("companyId", "companyName username email")
        .sort({ createdAt: -1 });

      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new TaskController();
