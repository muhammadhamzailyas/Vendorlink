import React from "react";
import { Input } from "../../ui";
import MagnifyingGlassableSelect from "./SearchableSelect";
import { getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en";

// Professional World Countries List
const WORLD_COUNTRIES = getCountries().map((country) => ({
  value: country,
  label: en[country],
})).sort((a, b) => a.label.localeCompare(b.label));

const AddressFields = ({ data, onChange }) => (
  <div className="pt-2 space-y-4">
    <p className="text-sm font-medium text-[var(--muted-foreground)]">Address Information</p>
    
    <Input
      className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
      placeholder="Street Address (e.g., 123 Main St, Apt 4B)"
      value={data.streetAddress || ""}
      onChange={(e) => onChange({ streetAddress: e.target.value })}
    />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MagnifyingGlassableSelect
          value={data.country}
          placeholder="Select Country"
          searchPlaceholder="MagnifyingGlass country..."
          options={WORLD_COUNTRIES}
          onChange={(val) => {
              // Extract label for compatibility if backend expects name
              const label = WORLD_COUNTRIES.find(c => c.value === val)?.label;
              onChange({ country: val, countryName: label });
          }}
        />
        <Input
          className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
          placeholder="Province / State / Region"
          value={data.province}
          onChange={(e) => onChange({ province: e.target.value })}
        />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
          placeholder="City"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
        <Input
          className="h-12 rounded-xl border-0 bg-[var(--muted)] px-4 font-medium"
          placeholder="Postal / Zip Code"
          type="number"
          numericOnly
          value={data.zipCode || ""}
          onChange={(e) => onChange({ zipCode: e.target.value })}
        />
    </div>
  </div>
);

export default AddressFields;
