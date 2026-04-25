const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  proposalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Proposal",
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

  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },

  scope: { type: String, required: true },
  deliverables: { type: String, required: true },

  vendorSkills: [String],
  vendorExperience: String,
  vendorApproach: String,

  totalBudget: { type: Number, required: true },
  currency: { type: String, default: "USD" },

  projectStartDate: { type: Date, required: true },
  projectEndDate: { type: Date, required: true },

  milestones: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      deadline: { type: Date, required: true },
      status: {
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: "pending",
      },
    },
  ],

  paymentTerms: {
    type: String,
    enum: ["milestone", "fixed", "hourly", "advance", "monthly"],
    default: "milestone",
  },
  paymentSchedule: {
    type: String,
    enum: [
      "upon-completion",
      "milestone-based",
      "weekly",
      "monthly",
      "advance-payment",
    ],
    default: "milestone-based",
  },
  paymentMethod: {
    type: String,
    enum: ["bank-transfer", "paypal", "stripe", "razorpay", "other"],
    default: "bank-transfer",
  },

  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    swiftCode: String,
  },

  revisionLimit: { type: Number, default: 3 },
  revisionPolicy: String,

  intellectualProperty: {
    type: String,
    enum: ["company", "vendor", "shared", "custom"],
    default: "company",
  },
  ipDetails: String,

  confidentialityClause: { type: Boolean, default: true },
  confidentialityPeriod: { type: Number, default: 24 },
  confidentialityDetails: String,

  terminationClause: {
    type: String,
    default:
      "Either party may terminate this agreement with 7 days written notice.",
  },
  noticePeriod: { type: Number, default: 7 },

  disputeResolution: {
    type: String,
    enum: ["negotiation", "mediation", "arbitration", "court"],
    default: "negotiation",
  },
  disputeResolutionDetails: String,
  governingLaw: { type: String, default: "Pakistan" },

  warrantyPeriod: { type: Number, default: 30 },
  warrantyDetails: String,

  contractDate: { type: Date, default: Date.now },
  effectiveDate: Date,

  companyApproved: { type: Boolean, default: false },
  vendorApproved: { type: Boolean, default: false },
  totalPaid: { type: Number, default: 0 },
  companyApprovedAt: Date,
  vendorApprovedAt: Date,

  companySignature: {
    name: String,
    date: Date,
  },
  vendorSignature: {
    name: String,
    date: Date,
  },

  status: {
    type: String,
    enum: [
      "draft",
      "pending-company",
      "pending-vendor",
      "active",
      "pending-completion",
      "completed",
      "cancelled",
      "disputed",
      "rejected",
    ],
    default: "draft",
  },
  activatedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  attachments: [
    {
      name: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  notes: [
    {
      content: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

contractSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

contractSchema.index({ companyId: 1, status: 1 });
contractSchema.index({ vendorId: 1, status: 1 });
contractSchema.index({ status: 1, createdAt: -1 });

contractSchema.virtual("bothApproved").get(function () {
  return this.companyApproved && this.vendorApproved;
});

contractSchema.virtual("progress").get(function () {
  if (this.milestones && this.milestones.length > 0) {
    const completed = this.milestones.filter(
      (m) => m.status === "completed"
    ).length;
    return Math.round((completed / this.milestones.length) * 100);
  }
  return 0;
});

const Contract =
  mongoose.models.Contract || mongoose.model("Contract", contractSchema);

module.exports = Contract;
