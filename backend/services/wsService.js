const WebSocket = require("ws");
const { Message, Conversation } = require("../model/Chat");
const User = require("../model/user");
const Task = require("../model/task");
const Notification = require("../model/Notification");
const { verifyFirebaseIdToken } = require("../utils/firebaseAdmin");

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, clientTracking: true });
    this.clients = new Map();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on("connection", async (ws, req) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
          ws.close(1008, "No token provided");
          return;
        }

        let decoded;
        try {
          decoded = await verifyFirebaseIdToken(token);
        } catch (err) {
          ws.close(1008, "Invalid token");
          return;
        }

        const userRecord = await User.findOne({ firebaseUid: decoded.uid }).select("_id role");
        const userId = userRecord?._id;
        const userType = userRecord?.role;

        if (!userId) {
          ws.close(1008, "Invalid user ID");
          return;
        }

        this.clients.set(userId.toString(), { ws, userType, userId: userId.toString() });

        ws.send(
          JSON.stringify({
            type: "connected",
            message: "Connected to server",
            userId,
            userType,
          })
        );

        await this.sendUndeliveredNotifications(userId.toString());

        ws.on("message", async (data) => {
          try {
            if (data.length > 64 * 1024) {
              ws.send(JSON.stringify({ type: "error", error: "Message too large" }));
              return;
            }
            const messageData = JSON.parse(data);
            await this.handleMessage(userId.toString(), userType, messageData);
          } catch (error) {
            ws.send(JSON.stringify({ type: "error", error: "Failed to process message" }));
          }
        });

        ws.on("close", () => {
          this.clients.delete(userId.toString());
        });

        ws.on("error", (error) => {
          console.error(`WebSocket error for user ${userId}:`, error);
        });
      } catch (error) {
        console.error("WebSocket connection error:", error);
        ws.close(1011, "Internal server error");
      }
    });
  }

  async sendUndeliveredNotifications(userId) {
    try {
      const undelivered = await Notification.find({
        recipientId: userId,
        delivered: false,
        read: false,
      }).populate("senderId", "username email role");

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
      case "ping":
        this.sendToUser(senderId, { type: "pong" });
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
        select: "username email role",
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

      this.sendToUser(receiverId.toString(), { type: "new-message", message: newMessage });
      this.sendToUser(senderId.toString(), { type: "message-sent", message: newMessage });
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
      const client = this.clients.get(userIdStr);

      if (client && client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
        return true;
      }
      return false;
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
          select: "username email role",
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
        const reader = this.clients.get(readerId.toString());
        if (reader) {
          if (reader.userType === "company") {
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

module.exports = WebSocketService;
