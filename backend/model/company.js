const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, required: true, trim: true },
    businessType: { type: String, trim: true, default: "" },
    industry: { type: String, required: true, trim: true },
    registrationNumber: { type: String, trim: true, default: "" },
    ntn: { type: String, trim: true, default: "" },
    yearEstablished: { type: Number },
    website: { type: String, trim: true, default: "" },
    companySize: { type: String, trim: true, default: "" },
    description: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: "" },
    province: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "Pakistan" },
    streetAddress: { type: String, trim: true, default: "" },
    zipCode: { type: String, trim: true, default: "" },
    registrationCertificateURL: { type: String, trim: true, default: "" },
    ntnCertificateURL: { type: String, trim: true, default: "" },
    supportingDocumentURL: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
