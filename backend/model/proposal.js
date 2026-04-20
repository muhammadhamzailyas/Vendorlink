const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bidAmount: {
    type: Number,
    required: true,
  },
  proposalText: {
    type: String,
    required: true,
  },

  proposedDeadline: {
    type: Date,
    required: true,
  },
  skills: [
    {
      type: String,
      required: true,
    },
  ],
  experience: {
    type: String,
    required: true,
  },
  portfolioLinks: [
    {
      type: String,
    },
  ],

  milestones: [
    {
      title: String,
      description: String,
      startAt: Date,
      deadline: Date,
      amount: Number,
    },
  ],
  availability: {
    type: String,
    enum: ["immediate", "1-week", "2-weeks", "1-month"],
    default: "immediate",
  },

  status: {
    type: String,
    enum: ["submitted", "accepted", "rejected"],
    default: "submitted",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
});

proposalSchema.index({ taskId: 1, vendorId: 1 });
proposalSchema.index({ vendorId: 1, status: 1 });
proposalSchema.index({ taskId: 1, status: 1 });

module.exports = mongoose.model("Proposal", proposalSchema);
