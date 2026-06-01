const { Server } = require("socket.io");
const { Message, Conversation } = require("../model/Chat");
const User = require("../model/user");
const Task = require("../model/task");
const Notification = require("../model/Notification");
const { verifyToken } = require("../utils/jwt");

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    this.clients = new Map(); // userId -> { socketId, userId, userType }
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.io.on("connection", async (socket) => {
      try {
        const token = socket.handshake.query.token;

        if (!token) {
          console.warn("[WS] Connection rejected: No token provided");
          socket.emit("error", { error: "Authentication token required" });
          socket.disconnect(true);
          return;
        }

        let decoded;
        try {
          decoded = verifyToken(token);
        } catch (err) {
          console.error("[WS] Token verification failed:", err.message);
          socket.emit("error", { error: "Invalid authentication token" });
          socket.disconnect(true);
          return;
        }

        const userRecord = await User.findById(decoded.id).select("_id role fullName email");
        const userId = userRecord?._id;
        const userType = userRecord?.role;

        if (!userId) {
          console.warn(`[WS] Connection rejected: User not found for UID ${decoded.uid}`);
          socket.emit("error", { error: "User account not found" });
          socket.disconnect(true);
          return;
        }

        const userIdStr = userId.toString();
        console.log(`[WS] User connected: ${userRecord.fullName || userRecord.email} (${userIdStr}) [${userType}]`);
        
        // Store client info
        this.clients.set(userIdStr, { socketId: socket.id, userId: userIdStr, userType });
        
        // Join a room for this specific user to easily send messages to all their devices if needed
        socket.join(userIdStr);

        socket.emit("connected", {
          message: "Connected to server",
          userId,
          userType,
        });

        await this.sendUndeliveredNotifications(userIdStr);

        socket.on("message", async (data) => {
          try {
            // Socket.io automatically parses JSON, but if it comes as a string, parse it
            const messageData = typeof data === 'string' ? JSON.parse(data) : data;
            await this.handleMessage(userIdStr, userType, messageData);
          } catch (error) {
            socket.emit("error", { error: "Failed to process message" });
          }
        });

        // Add explicit handlers for the message types if the client emits them directly
        const handlers = ["send-message", "get-messages", "mark-read", "typing", "stop-typing"];
        handlers.forEach(type => {
          socket.on(type, async (data) => {
            try {
              await this.handleMessage(userIdStr, userType, { ...data, type });
            } catch (error) {
              socket.emit("error", { error: `Failed to process ${type}` });
            }
          });
        });

        socket.on("disconnect", () => {
          console.log(`[WS] User disconnected: ${userIdStr}`);
          this.clients.delete(userIdStr);
        });

        socket.on("error", (error) => {
          console.error(`Socket.io error for user ${userIdStr}:`, error);
        });
      } catch (error) {
        console.error("Socket.io connection error:", error);
        socket.disconnect(true);
      }
    });
  }

  async sendUndeliveredNotifications(userId) {
    try {
      const undelivered = await Notification.find({
        recipientId: userId,
        delivered: false,
        read: false,
      }).populate("senderId", "fullName email role");

      for (const notification of undelivered) {
        const sent = this.sendToUser(userId, {
          type: "notification",
          notification: {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            priority: notification.priority,
            createdAt: notification.createdAt,
            read: false,
            relatedId: notification.relatedId,
            relatedModel: notification.relatedModel,
            senderId: notification.senderId,
          },
        });

        if (sent) {
          notification.delivered = true;
          notification.deliveredAt = new Date();
          await notification.save();
        }
      }
    } catch (error) {
      console.error("Error sending undelivered notifications:", error);
    }
  }

  async handleMessage(senderId, senderType, data) {
    const { type, taskId, receiverId, message, page = 1 } = data;
    const safePage = Math.max(1, Math.min(parseInt(page) || 1, 1000));

    switch (type) {
      case "send-message":
        if (!taskId || !receiverId || !message) {
          this.sendToUser(senderId, {
            type: "error",
            error: "Missing required fields: taskId, receiverId, or message",
          });
          return;
        }
        await this.sendChatMessage(senderId, senderType, taskId, receiverId, message);
        break;
      case "get-messages":
        await this.getMessages(senderId, taskId, safePage);
        break;
      case "mark-read":
        await this.markMessagesRead(senderId, taskId, data.senderId);
        break;
      case "typing":
        this.sendTypingIndicator(senderId, taskId, receiverId, true);
        break;
      case "stop-typing":
        this.sendTypingIndicator(senderId, taskId, receiverId, false);
        break;
      default:
        break;
    }
  }

  async sendChatMessage(senderId, senderType, taskId, receiverId, messageText) {
    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
      if (!sender || !receiver) throw new Error("Sender or receiver not found");

      const newMessage = new Message({
        senderId,
        receiverId,
        message: messageText,
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
        if (!task) return;

        conversation = await Conversation.create({
          taskId,
          companyId: task.companyId,
          vendorId: task.selectedVendor,
          lastMessage: messageText,
          lastMessageAt: new Date(),
          lastMessageSender: senderType,
          unreadCount: {
            company: senderType === "company" ? 0 : 1,
            vendor: senderType === "vendor" ? 0 : 1,
          },
        });
      } else {
        conversation.lastMessage = messageText;
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSender = senderType;
        if (senderType === "company") {
          conversation.unreadCount.vendor += 1;
        } else {
          conversation.unreadCount.company += 1;
        }
        await conversation.save();
      }

      // Send to both receiver and sender for real-time UI updates
      this.sendToUser(receiverId.toString(), { type: "new-message", message: newMessage });
      this.sendToUser(senderId.toString(), { type: "new-message", message: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      this.sendToUser(senderId.toString(), {
        type: "error",
        error: "Failed to send message: " + error.message,
      });
    }
  }

  sendToUser(userId, data) {
    try {
      const userIdStr = userId.toString();
      // Use Socket.io rooms to send to all connections for this user
      this.io.to(userIdStr).emit(data.type || "message", data);
      return true;
    } catch (error) {
      console.error(`Error sending to user ${userId}:`, error);
      return false;
    }
  }

  async getMessages(userId, taskId, page = 1) {
    try {
      const limit = 50;
      const messages = await Message.find({ taskId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "senderId",
          select: "fullName email role",
          model: "User",
        });

      this.sendToUser(userId, {
        type: "messages-history",
        messages: messages.reverse(),
        hasMore: messages.length === limit,
        taskId,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async markMessagesRead(readerId, taskId, senderId) {
    try {
      await Message.updateMany(
        { taskId, senderId, receiverId: readerId, read: false },
        { read: true, readAt: new Date() }
      );

      const conversation = await Conversation.findOne({ taskId });
      if (conversation) {
        const clientInfo = this.clients.get(readerId.toString());
        if (clientInfo) {
          if (clientInfo.userType === "company") {
            conversation.unreadCount.company = 0;
          } else {
            conversation.unreadCount.vendor = 0;
          }
          await conversation.save();
        }
      }

      this.sendToUser(senderId, { type: "messages-read", taskId, readerId });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  sendTypingIndicator(senderId, taskId, receiverId, isTyping) {
    this.sendToUser(receiverId, {
      type: isTyping ? "user-typing" : "user-stop-typing",
      taskId,
      userId: senderId,
    });
  }
}

module.exports = SocketService;
