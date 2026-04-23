const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

router.get("/", notificationController.getUserNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/read-multiple", notificationController.markMultipleAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/read/all", notificationController.deleteReadNotifications);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
