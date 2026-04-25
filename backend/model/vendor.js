const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    vendorType: { type: String, trim: true, default: "" },
    cnicNumber: { type: String, trim: true, default: "" },
    businessName: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
    ntn: { type: String, trim: true, default: "" },
    category: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    yearsOfExperience: { type: Number },
    portfolioURL: { type: String, trim: true, default: "" },
    bio: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "Pakistan" },
    streetAddress: { type: String, trim: true, default: "" },
    zipCode: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    accountTitle: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    cnicFrontURL: { type: String, trim: true, default: "" },
    cnicBackURL: { type: String, trim: true, default: "" },
    businessLicenseURL: { type: String, trim: true, default: "" },
    portfolioSamplesURL: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
