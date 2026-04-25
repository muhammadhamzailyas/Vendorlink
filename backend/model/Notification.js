const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  type: {
    type: String,
    enum: [
      "proposal_submitted",
      "proposal_accepted",
      "proposal_rejected",
      "proposal_updated",
      "proposal_withdrawn",
      "contract_created",
      "contract_approved",
      "contract_rejected",
      "contract_completed",
      "contract_cancelled",
      "contract_needs_review",
      "contract_awaiting_approval",
      "task_created",
      "task_completed",
      "task_updated",
      "task_deleted",
      "message_received",
      "user_approved",
      "user_rejected",
      "new_user",
      "verification_approved",
      "verification_rejected",
      "account_approved",
      "account_rejected",
      "account_deactivated",
      "payment_received",
      "milestone_completed",
      "progress_updated",
      "system_alert",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel",
  },
  relatedModel: {
    type: String,
    enum: ["Task", "Proposal", "Contract", "User", "Message"],
    default: null,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  delivered: { type: Boolean, default: false },
  deliveredAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000),
  },
});

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

notificationSchema.methods.markAsRead = async function () {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.statics.markMultipleAsRead = async function (
  recipientId,
  notificationIds
) {
  return this.updateMany(
    { _id: { $in: notificationIds }, recipientId },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.markAllAsRead = async function (recipientId) {
  return this.updateMany(
    { recipientId, read: false },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = async function (recipientId) {
  return this.countDocuments({ recipientId, read: false });
};

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
