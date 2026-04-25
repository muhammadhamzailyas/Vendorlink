const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedBalance: {
      type: Number,
      default: 0,
    },
    totalDeposited: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    totalReceived: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active",
    },
    bankDetails: {
      bankName: String,
      accountTitle: String,
      accountNumber: String,
      iban: String,
      branchCode: String,
    },
    jazzCashDetails: {
      mobileNumber: String,
      accountTitle: String,
    },
    easypaisaDetails: {
      mobileNumber: String,
      accountTitle: String,
    },
    lastTransactionAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
