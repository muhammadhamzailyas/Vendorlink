import React from "react";
import { Input, Label, Tabs } from "../../ui";

const VENDOR_TYPE_OPTIONS = [
  { label: "Individual Freelancer", value: "Individual" },
  { label: "Registered Business", value: "Registered Business" },
];

const VendorBusinessFields = ({ data, errors = {}, onChange }) => (
  <>
    <div className="mb-4">
      <Label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground/60">
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
      placeholder="National ID / Passport / CNIC number"
      type="text"
      value={data.cnicNumber}
      error={errors.cnicNumber}
      onChange={(e) => {
        let val = e.target.value.replace(/\D/g, ""); // Digits only
        if (val.length > 5 && val.length <= 12) {
          val = val.slice(0, 5) + "-" + val.slice(5);
        } else if (val.length > 12) {
          val = val.slice(0, 5) + "-" + val.slice(5, 12) + "-" + val.slice(12, 13);
        }
        onChange({ cnicNumber: val });
      }}
    />
    {data.vendorType === "Registered Business" && (
        <>
            <Input
              placeholder="Business name"
              value={data.businessName}
              error={errors.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Reg number (optional)"
                  type="text"
                  value={data.registrationNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    onChange({ registrationNumber: val });
                  }}
                />
                <Input
                  placeholder="Tax ID / VAT / NTN (optional)"
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
        </>
    )}
  </>
);

export default VendorBusinessFields;



