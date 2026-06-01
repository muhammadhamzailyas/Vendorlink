import React from "react";
import { Input, Textarea } from "../../ui";
import SearchableSelect from "./SearchableSelect";

const BUSINESS_TYPE_OPTIONS = [
  { value: "Private Limited", label: "Private Limited Company" },
  { value: "Public Limited", label: "Public Limited Company" },
  { value: "Sole Proprietor", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "NGO", label: "Non-Governmental Organization (NGO)" },
  { value: "Trust", label: "Trust / Foundation" },
  { value: "Cooperative", label: "Cooperative Society" },
  { value: "Freelancer", label: "Freelancer / Independent" },
  { value: "Government", label: "Government Body" },
];

const RAW_INDUSTRIES = [
  { value: "IT", label: "IT & Software Development" },
  { value: "AI", label: "AI & Data Science" },
  { value: "Design", label: "Graphics & Design" },
  { value: "Marketing", label: "Digital Marketing" },
  { value: "Writing", label: "Writing & Translation" },
  { value: "Video", label: "Video & Animation" },
  { value: "Music", label: "Music & Audio" },
  { value: "Consulting", label: "Business & Consulting" },
  { value: "Sales", label: "Sales & Customer Support" },
  { value: "Legal", label: "Legal & Compliance" },
  { value: "Finance", label: "Accounting & Finance" },
  { value: "Architecture", label: "Architecture & Interior Design" },
  { value: "Manufacturing", label: "Engineering & Manufacturing" },
  { value: "Healthcare", label: "Healthcare & Life Sciences" },
  { value: "Education", label: "Education & E-learning" },
  { value: "Ecommerce", label: "E-commerce & Retail" },
  { value: "Logistics", label: "Logistics & Supply Chain" },
  { value: "RealEstate", label: "Real Estate" },
  { value: "Media", label: "Media & Entertainment" },
  { value: "NGO", label: "Non-profit & NGO" },
];

const INDUSTRY_OPTIONS = [
  ...RAW_INDUSTRIES.sort((a, b) => a.label.localeCompare(b.label)),
  { value: "Other", label: "Other" }
];

const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "501-1000", label: "501–1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 1900 + 1 },
  (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: (new Date().getFullYear() - i).toString(),
  })
);

const CompanyBusinessFields = ({ data, errors = {}, onChange }) => (
  <>
    <Input
      placeholder="Company/Business name"
      value={data.companyName}
      error={errors.companyName}
      onChange={(e) => onChange({ companyName: e.target.value })}
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          value={data.businessType}
          placeholder="Business type"
          searchPlaceholder="Search type..."
          options={BUSINESS_TYPE_OPTIONS}
          error={errors.businessType}
          onChange={(val) => onChange({ businessType: val })}
        />
        <SearchableSelect
          value={data.industry}
          placeholder="Industry/Sector"
          searchPlaceholder="Search industry..."
          options={INDUSTRY_OPTIONS}
          error={errors.industry}
          onChange={(val) => onChange({ industry: val })}
        />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Registration number / License no."
          type="text"
          value={data.registrationNumber}
          error={errors.registrationNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            onChange({ registrationNumber: val });
          }}
        />
        <Input
          placeholder="Tax ID / VAT / NTN number"
          type="text"
          value={data.ntn}
          onChange={(e) => {
            let val = e.target.value.replace(/\D/g, "");
            // Format NTN for PK: XXXXXXX-X
            if (val.length > 7) {
                val = val.slice(0, 7) + "-" + val.slice(7, 8);
            }
            onChange({ ntn: val });
          }}
        />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          value={data.yearEstablished}
          placeholder="Year established"
          searchPlaceholder="Search year..."
          options={YEAR_OPTIONS}
          error={errors.yearEstablished}
          onChange={(val) => onChange({ yearEstablished: val })}
        />
        <SearchableSelect
          value={data.companySize}
          placeholder="Company size"
          searchPlaceholder="Search size..."
          options={COMPANY_SIZE_OPTIONS}
          error={errors.companySize}
          onChange={(val) => onChange({ companySize: val })}
        />
    </div>
    <Input
      placeholder="Company website (optional)"
      value={data.website}
      onChange={(e) => onChange({ website: e.target.value })}
    />
    <Textarea
      className="min-h-24"
      placeholder="Briefly describe your company and services..."
      value={data.description}
      error={errors.description}
      onChange={(e) => onChange({ description: e.target.value })}
    />
  </>
);

export default CompanyBusinessFields;
