const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      default: null, // null for OAuth users
      select: false, // never returned in queries by default
    },
    googleId: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
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
    role: {
      type: String,
      enum: ["admin", "company", "vendor", "unassigned"],
      default: "unassigned",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deactivated"],
      default: "pending",
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationCode: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
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
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Robust Unique Partial Indexes
// Only enforce uniqueness if the field is present and is a string (not null)
userSchema.index(
    { googleId: 1 }, 
    { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
);

userSchema.index(
    { uid: 1 }, 
    { unique: true, partialFilterExpression: { uid: { $type: "string" } } }
);

// Pre-save hook to hash password and generate background UID
userSchema.pre("save", async function (next) {
  // Generate background UID if not exists
  if (!this.uid) {
    this.uid = `VL-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  }

  if (!this.isModified("password") || !this.password) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
