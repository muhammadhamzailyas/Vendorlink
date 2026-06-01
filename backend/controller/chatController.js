const { Message, Conversation } = require("../model/Chat");
const Task = require("../model/task");
const User = require("../model/user");
const Contract = require("../model/Contract");

const getNotificationService = (req) => {
  try {
    return req.app?.get("notificationService");
  } catch {
    return null;
  }
};

exports.getChatPartners = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const role = req.user.role;

    // Find all active or pending-completion contracts
    const contracts = await Contract.find({
      [role === "company" ? "companyId" : "vendorId"]: userId,
      status: { $in: ["active", "pending-completion", "completed"] },
      companyApproved: true,
      vendorApproved: true,
    })
      .populate("taskId", "title category status")
      .populate(role === "company" ? "vendorId" : "companyId", "fullName email profileImage");

    const partners = await Promise.all(contracts.map(async (contract) => {
      const partner = role === "company" ? contract.vendorId : contract.companyId;
      if (!partner || !contract.taskId) return null;

      // Ensure a conversation exists for this task
      let conversation = await Conversation.findOne({ taskId: contract.taskId._id });
      if (!conversation) {
        conversation = await Conversation.create({
          taskId: contract.taskId._id,
          companyId: contract.companyId,
          vendorId: contract.vendorId,
          lastMessage: "System: Tap to start chatting",
          lastMessageAt: contract.createdAt,
          lastMessageSender: "system",
        });
      }

      return {
        conversationId: conversation._id,
        taskId: contract.taskId._id,
        taskTitle: contract.taskId.title,
        partnerId: partner._id,
        partnerName: partner.fullName || partner.email,
        partnerImage: partner.profileImage,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: role === "company" ? conversation.unreadCount.company : conversation.unreadCount.vendor,
        contractStatus: contract.status
      };
    }));

    // Filter out nulls and sort by last message
    const filteredPartners = partners
      .filter(p => p !== null)
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json({ success: true, data: filteredPartners });
  } catch (error) {
    console.error("Error in getChatPartners:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userType = req.user.role;

    let conversations;
    if (userType === "company") {
      conversations = await Conversation.find({ companyId: userId })
        .populate({ path: "vendorId", select: "fullName email", model: "User" })
        .populate({ path: "taskId", select: "title budget status", model: "Task" })
        .sort({ lastMessageAt: -1 });
    } else {
      conversations = await Conversation.find({ vendorId: userId })
        .populate({ path: "companyId", select: "fullName email", model: "User" })
        .populate({ path: "taskId", select: "title budget status", model: "Task" })
        .sort({ lastMessageAt: -1 });
    }

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error("Error in getConversations:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findOne({ taskId });
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    if (
      conversation.companyId.toString() !== userId &&
      conversation.vendorId.toString() !== userId
    ) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const messages = await Message.find({ taskId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate({ path: "senderId", select: "fullName email role", model: "User" });

    await Message.updateMany(
      { taskId, receiverId: userId, read: false },
      { read: true, readAt: new Date() }
    );

    if (req.user.role === "company") {
      conversation.unreadCount.company = 0;
    } else {
      conversation.unreadCount.vendor = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      data: messages.reverse(),
      hasMore: messages.length === parseInt(limit),
    });
  } catch (error) {
    console.error("Error in getTaskMessages:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const { taskId } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    let conversation = await Conversation.findOne({ taskId });

    if (!conversation) {
      const companyId = task.companyId;
      const vendorId = task.selectedVendor;

      if (!companyId || !vendorId) {
        return res
          .status(400)
          .json({ success: false, error: "Company or vendor information missing" });
      }

      conversation = await Conversation.create({
        taskId,
        companyId,
        vendorId,
        lastMessage: "Conversation started",
        lastMessageAt: new Date(),
        lastMessageSender: "system",
        unreadCount: { company: 0, vendor: 0 },
      });

      const notificationService = getNotificationService(req);
      if (notificationService) {
        await notificationService.createNotification({
          recipientId: vendorId,
          senderId: companyId,
          type: "message_received",
          title: "New Conversation Started",
          message: `You can now chat about task: ${task.title}`,
          data: { taskId: task._id, taskTitle: task.title, conversationId: conversation._id },
          relatedId: conversation._id,
          relatedModel: "Message",
          priority: "medium",
        });
        await notificationService.createNotification({
          recipientId: companyId,
          senderId: vendorId,
          type: "message_received",
          title: "New Conversation Started",
          message: `You can now chat about task: ${task.title}`,
          data: { taskId: task._id, taskTitle: task.title, conversationId: conversation._id },
          relatedId: conversation._id,
          relatedModel: "Message",
          priority: "medium",
        });
      }
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userType = req.user.role;

    const conversations = await Conversation.find(
      userType === "company" ? { companyId: userId } : { vendorId: userId }
    );

    const unreadCount = conversations.reduce((total, conv) => {
      return total + (userType === "company" ? conv.unreadCount.company : conv.unreadCount.vendor);
    }, 0);

    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    if (
      conversation.companyId.toString() !== userId &&
      conversation.vendorId.toString() !== userId
    ) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    await Message.deleteMany({ taskId: conversation.taskId });
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { taskId, receiverId, message } = req.body;
    const senderId = req.user._id.toString();
    const senderType = req.user.role;

    if (!taskId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: taskId, receiverId, or message",
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
      taskId,
      read: false,
    });
    await newMessage.save();

    await newMessage.populate({
      path: "senderId",
      select: "fullName email role",
      model: "User",
    });

    let conversation = await Conversation.findOne({ taskId });

    if (!conversation) {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }

      conversation = await Conversation.create({
        taskId,
        companyId: task.companyId,
        vendorId: task.selectedVendor,
        lastMessage: message,
        lastMessageAt: new Date(),
        lastMessageSender: senderType,
        unreadCount: {
          company: senderType === "company" ? 0 : 1,
          vendor: senderType === "vendor" ? 0 : 1,
        },
      });
    } else {
      conversation.lastMessage = message;
      conversation.lastMessageAt = new Date();
      conversation.lastMessageSender = senderType;
      if (senderType === "company") {
        conversation.unreadCount.vendor += 1;
      } else {
        conversation.unreadCount.company += 1;
      }
      await conversation.save();
    }

    // The wsService will handle real-time delivery
    const wsService = req.app.get("wsService");
    if (wsService) {
      wsService.sendToUser(receiverId.toString(), { type: "new-message", message: newMessage });
      wsService.sendToUser(senderId.toString(), { type: "new-message", message: newMessage });
    }

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
