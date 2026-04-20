const mongoose = require("mongoose");

const progressUpdateSchema = new mongoose.Schema({
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
  updateDate: { type: Date, required: true },
  comment: { type: String, required: true },
  status: {
    type: String,
    enum: ["in-progress", "completed", "blocked", "review", "on-hold"],
    default: "in-progress",
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

progressUpdateSchema.index(
  { taskId: 1, vendorId: 1, updateDate: 1 },
  { unique: true }
);

progressUpdateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ProgressUpdate", progressUpdateSchema);
