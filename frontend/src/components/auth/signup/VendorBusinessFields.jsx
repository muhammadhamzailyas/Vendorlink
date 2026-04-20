import React from "react";
import { Input, Label, Tabs } from "../../ui";

const VENDOR_TYPE_OPTIONS = [
  { label: "Individual Freelancer", value: "Individual" },
  { label: "Registered Business", value: "Registered Business" },
];

const VendorBusinessFields = ({ data, onChange }) => (
  <>
    <div className="mb-4">
      <Label className="mb-2 block text-xs uppercase tracking-widest text-[var(--muted-foreground)]/60">
        Vendor Type
      </Label>
      <Tabs
        value={data.vendorType}
        onChange={(val) => onChange({ vendorType: val })}
        tabs={VENDOR_TYPE_OPTIONS}
        className="h-12"
      />
    </div>
    <Input
      className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
      placeholder="National ID / Passport / CNIC Number"
      type="number"
      numericOnly
      value={data.cnicNumber}
      onChange={(e) => onChange({ cnicNumber: e.target.value })}
    />
    {data.vendorType === "Registered Business" && (
        <>
            <Input
              className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
              placeholder="Business Name"
              value={data.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
                  placeholder="Reg Number (optional)"
                  type="number"
                  numericOnly
                  value={data.registrationNumber}
                  onChange={(e) => onChange({ registrationNumber: e.target.value })}
                />
                <Input
                  className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
                  placeholder="Tax ID / VAT / NTN (optional)"
                  type="number"
                  numericOnly
                  value={data.ntn}
                  onChange={(e) => onChange({ ntn: e.target.value })}
                />
            </div>
        </>
    )}
  </>
);

export default VendorBusinessFields;
