const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "completed", "cancelled"],
    default: "open",
  },
  selectedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  skills: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  taskType: {
    type: String,
    enum: ["fixed-price", "hourly", "milestone-based"],
    default: "fixed-price"
  },
  complexity: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "intermediate"
  },
  duration: {
    type: String,
    default: "1-3-months"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

taskSchema.index({ companyId: 1, status: 1 });
taskSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
