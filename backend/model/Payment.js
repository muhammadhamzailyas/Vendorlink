const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contract",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" },

  amount: { type: Number, required: true, min: 0 },
  originalAmount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  vendorAmount: { type: Number, default: 0 },
  paymentType: {
    type: String,
    enum: ["advance", "milestone", "full", "partial", "final"],
    default: "full",
  },
  milestoneId: { type: mongoose.Schema.Types.ObjectId },
  milestoneTitle: String,

  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "completed",
      "failed",
      "refunded",
      "cancelled",
    ],
    default: "pending",
  },

  paymentMethod: { type: String, default: "wallet" },
  paymentGateway: { type: String, default: "internal" },

  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", unique: true, sparse: true },
  invoiceNumber: { type: String, unique: true },

  advanceAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },

  vendorConfirmed: { type: Boolean, default: false },
  vendorConfirmedAt: Date,

  paymentDate: Date,
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date,

  notes: String,
  adminNotes: String,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

paymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

paymentSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const count = await mongoose.model("Payment").countDocuments();
    this.invoiceNumber = `VL-${year}${month}${day}-${(count + 1)
      .toString()
      .padStart(4, "0")}-${random}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
