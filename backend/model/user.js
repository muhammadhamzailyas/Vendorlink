const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    firebaseUid: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ["firebase"],
      default: "firebase"
    },
    role: {
      type: String,
      enum: ["admin", "company", "vendor", "unassigned"],
      default: "unassigned",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletionReason: {
      type: String,
      trim: true,
      default: "",
    },
    profileCompleted: { type: Boolean, default: false },
    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    selectedPlan: {
      type: String,
      enum: ["free", "premium", "enterprise"],
      default: "free",
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

module.exports = mongoose.model("User", userSchema);
