const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatController");
const { authmiddleware } = require("../middleware/authmiddle");

router.use(authmiddleware);

router.get("/conversations", chatController.getConversations);
router.get("/partners", chatController.getChatPartners);
router.get("/messages/:taskId", chatController.getTaskMessages);
router.post("/conversation", chatController.startConversation);
router.get("/unread", chatController.getUnreadCount);
router.delete("/conversation/:conversationId", chatController.deleteConversation);
router.post("/message", chatController.sendMessage);

module.exports = router;
