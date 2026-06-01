import React, { useMemo } from "react";
import { Input } from "../../ui";
import SearchableSelect from "./SearchableSelect";
import { Country, State, City } from "country-state-city";

// Fetch all countries and format for select
const WORLD_COUNTRIES = Country.getAllCountries().map((country) => ({
  value: country.isoCode,
  label: country.name,
}));

const AddressFields = ({ data, onChange, errors = {} }) => {
  // Memoize state/province options based on selected country
  const provinceOptions = useMemo(() => {
    if (!data.country) return [];
    return State.getStatesOfCountry(data.country).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }, [data.country]);

  // Memoize city options based on selected country and state
  // data.province stores the ISO code of the state
  const cityOptions = useMemo(() => {
    if (!data.country || !data.province) return [];
    return City.getCitiesOfState(data.country, data.province).map((city) => ({
      value: city.name,
      label: city.name,
    }));
  }, [data.country, data.province]);

  return (
    <div className="pt-2 space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Address Information</p>
      
      <Input
        placeholder="Street address (e.g., 123 Main St, Apt 4B)"
        value={data.streetAddress || ""}
        error={errors.streetAddress}
        onChange={(e) => onChange({ streetAddress: e.target.value })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchableSelect
            value={data.country}
            placeholder="Select country"
            searchPlaceholder="Search country..."
            options={WORLD_COUNTRIES}
            error={errors.country}
            onChange={(val) => {
                const label = WORLD_COUNTRIES.find(c => c.value === val)?.label;
                // Reset province and city when country changes
                onChange({ 
                  country: val, 
                  countryName: label, 
                  province: "", 
                  provinceName: "", 
                  city: "" 
                });
            }}
          />
          
          {provinceOptions.length > 0 ? (
            <SearchableSelect
              value={data.province}
              placeholder="Province / State"
              searchPlaceholder="Search province..."
              options={provinceOptions}
              error={errors.province}
              onChange={(val) => {
                const label = provinceOptions.find(s => s.value === val)?.label;
                onChange({ province: val, provinceName: label, city: "" });
              }}
            />
          ) : (
            <Input
              placeholder="Province / State / Region"
              value={data.province}
              error={errors.province}
              onChange={(e) => onChange({ province: e.target.value, provinceName: e.target.value })}
            />
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cityOptions.length > 0 ? (
            <SearchableSelect
              value={data.city}
              placeholder="City"
              searchPlaceholder="Search city..."
              options={cityOptions}
              error={errors.city}
              onChange={(val) => onChange({ city: val })}
            />
          ) : (
            <Input
              placeholder="City"
              value={data.city}
              error={errors.city}
              onChange={(e) => onChange({ city: e.target.value })}
            />
          )}
          <Input
            placeholder="Postal / Zip code"
            type="text"
            value={data.zipCode || ""}
            error={errors.zipCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange({ zipCode: val });
            }}
          />
      </div>
    </div>
  );
};

export default AddressFields;
