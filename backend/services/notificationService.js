const Notification = require("../model/Notification");

class NotificationService {
  constructor(wsService) {
    this.wsService = wsService;
  }

  async createNotification({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    data = {},
    relatedId = null,
    relatedModel = null,
    priority = "medium",
  }) {
    try {
      const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        title,
        message,
        data,
        relatedId,
        relatedModel,
        priority,
        read: false,
        delivered: false,
      });

      if (senderId) {
        await notification.populate("senderId", "fullName email role");
      }

      let delivered = false;
      if (this.wsService) {
        delivered = this.wsService.sendToUser(recipientId.toString(), {
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
      }

      if (delivered) {
        notification.delivered = true;
        notification.deliveredAt = new Date();
        await notification.save();
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async getUserNotifications(userId, page = 1, limit = 20, filter = {}) {
    try {
      const query = { recipientId: userId };

      // Handle filter object from controller
      if (filter.read !== undefined) {
        query.read = filter.read;
      } else if (filter === "unread") {
        // Support legacy string filter
        query.read = false;
      }

      if (filter.type) {
        query.type = filter.type;
      } else if (typeof filter === "string" && filter !== "all" && filter !== "unread") {
        // Support legacy string filters for specific types
        query.type = { $regex: filter, $options: "i" };
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("senderId", "fullName email role");

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        notifications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        unreadCount,
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (notification && this.wsService) {
        this.wsService.sendToUser(userId.toString(), {
          type: "notification-read",
          notificationId: notification._id,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markMultipleAsRead(userId, notificationIds) {
    try {
      const result = await Notification.updateMany(
        { _id: { $in: notificationIds }, recipientId: userId },
        { read: true, readAt: new Date() }
      );

      if (result.modifiedCount > 0 && this.wsService) {
        this.wsService.sendToUser(userId.toString(), {
          type: "notifications-read",
          notificationIds,
        });
      }

      return result;
    } catch (error) {
      console.error("Error marking multiple notifications as read:", error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipientId: userId, read: false },
        { read: true, readAt: new Date() }
      );

      if (result.modifiedCount > 0 && this.wsService) {
        this.wsService.sendToUser(userId.toString(), {
          type: "all-notifications-read",
        });
      }

      return result;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  async deleteNotification(userId, notificationId) {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId,
      });

      if (result && this.wsService) {
        this.wsService.sendToUser(userId.toString(), {
          type: "notification-deleted",
          notificationId,
        });
      }

      return result;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  async deleteReadNotifications(userId) {
    try {
      const result = await Notification.deleteMany({
        recipientId: userId,
        read: true,
      });

      if (result.deletedCount > 0 && this.wsService) {
        this.wsService.sendToUser(userId.toString(), {
          type: "read-notifications-deleted",
          count: result.deletedCount,
        });
      }

      return result;
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }
}

module.exports = NotificationService;
