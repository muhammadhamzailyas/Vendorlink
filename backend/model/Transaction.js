const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
    },

    fromBalanceAfter: Number,
    toBalanceAfter: Number,

    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "payment",
        "refund",
        "fee",
        "transfer",
        "subscription",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "bank_transfer",
        "jazzcash",
        "easypaisa",
        "wallet_balance",
        "admin_adjustment",
        "stripe",
        "credit_card",
      ],
    },

    gateway: {
      name: String,
      transactionId: String,
      reference: String,
      response: mongoose.Schema.Types.Mixed,
    },

    description: String,
    notes: String,
    adminNotes: String,

    withdrawalDetails: {
      bankName: String,
      accountTitle: String,
      accountNumber: String,
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      processedAt: Date,
    },

    reference: String,
    invoiceNumber: String,

    completedAt: Date,
  },
  { timestamps: true }
);

transactionSchema.pre("save", async function (next) {
  if (!this.invoiceNumber && this.type === "payment") {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const count = await mongoose.model("Transaction").countDocuments();
    this.invoiceNumber = `TXN-${year}${month}-${(count + 1)
      .toString()
      .padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
