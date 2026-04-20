const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

router.get("/", (req, res) => notificationController.getUserNotifications(req, res));
router.get("/unread-count", (req, res) => notificationController.getUnreadCount(req, res));
router.put("/mark-all-read", (req, res) => notificationController.markAllAsRead(req, res));
router.put("/read-multiple", (req, res) => notificationController.markMultipleAsRead(req, res));
router.put("/:id/read", (req, res) => notificationController.markAsRead(req, res));
router.delete("/read/all", (req, res) => notificationController.deleteReadNotifications(req, res));
router.delete("/:id", (req, res) => notificationController.deleteNotification(req, res));

module.exports = router;
