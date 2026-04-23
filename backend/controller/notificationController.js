class NotificationController {
  constructor() {
    // Bind all methods
    this.getUserNotifications = this.getUserNotifications.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markMultipleAsRead = this.markMultipleAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.deleteReadNotifications = this.deleteReadNotifications.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
  }

  /**
   * Helper to get notification service from request app
   */
  getService(req) {
    const service = req.app.get("notificationService");
    if (!service) {
      throw new Error("NotificationService not found in app container");
    }
    return service;
  }

  async getUserNotifications(req, res) {
    try {
      const userId = req.user._id.toString();
      const { page = 1, limit = 20, type, read } = req.query;

      const safePage = Math.max(1, parseInt(page) || 1);
      const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

      const filter = {};
      if (type) filter.type = type;
      if (read !== undefined) filter.read = read === "true";

      const service = this.getService(req);
      const result = await service.getUserNotifications(
        userId,
        safePage,
        safeLimit,
        filter
      );

      res.json(result);
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      const service = this.getService(req);
      const notification = await service.markAsRead(userId, id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({ message: "Notification marked as read", notification });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }

  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user._id.toString();

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ error: "notificationIds array is required" });
      }

      const service = this.getService(req);
      const result = await service.markMultipleAsRead(userId, notificationIds);
      res.json({ message: "Notifications marked as read", modifiedCount: result.modifiedCount });
    } catch (error) {
      console.error("Error marking multiple notifications:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user._id.toString();
      const service = this.getService(req);
      const result = await service.markAllAsRead(userId);
      res.json({ message: "All notifications marked as read", modifiedCount: result.modifiedCount });
    } catch (error) {
      console.error("Error marking all notifications:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id.toString();

      const service = this.getService(req);
      const result = await service.deleteNotification(userId, id);
      if (!result) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  }

  async deleteReadNotifications(req, res) {
    try {
      const userId = req.user._id.toString();
      const service = this.getService(req);
      const result = await service.deleteReadNotifications(userId);
      res.json({ message: "Read notifications deleted", deletedCount: result.deletedCount });
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      res.status(500).json({ error: "Failed to delete read notifications" });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user._id.toString();
      const service = this.getService(req);
      const count = await service.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  }
}

module.exports = new NotificationController();
