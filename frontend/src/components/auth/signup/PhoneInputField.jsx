import React, { useState, useMemo } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Popover, PopoverTrigger, PopoverContent, ScrollArea, Button } from "../../ui";
import { cn } from "@/lib/cn";
import { getCountries } from "react-phone-number-input";
import { AsYouType, getCountryCallingCode } from "libphonenumber-js";
import en from "react-phone-number-input/locale/en";
import Flags from "react-phone-number-input/flags";

// Generate full country list sorted alphabetically by Name
const FINAL_COUNTRIES = getCountries().map((country) => ({
  code: country,
  name: en[country],
  dial: `+${getCountryCallingCode(country)}`,
})).sort((a, b) => a.name.localeCompare(b.name));

const PhoneInputField = ({ countryCode, isoCode, phone, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    return FINAL_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Get the flag component for the selected country
  const SelectedFlag = Flags[isoCode];

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex h-12 w-full items-stretch overflow-hidden rounded-xl bg-input-bg transition-all duration-200",
          "border border-input-border focus-within:ring-2 focus-within:ring-input-focus/15 focus-within:border-input-focus focus-within:shadow-soft"
        )}
      >
          {/* Custom Popover Country Selector (Themed for high contrast) */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button 
                type="button"
                className="flex items-center gap-2 border-r border-input-border/50 bg-muted/50 px-3 transition-colors hover:bg-muted"
              >
                <div className="flex h-3.5 w-5 overflow-hidden rounded-sm border border-white/5 bg-muted shrink-0">
                    {SelectedFlag ? <SelectedFlag /> : <span className="text-[8px]">{isoCode}</span>}
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">{countryCode}</span>
                <CaretDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-2 bg-popover border-input-border shadow-2xl rounded-xl overflow-hidden z-[100]" align="start">
              <div className="mb-2 p-1">
                  <div className="relative bg-muted/50 rounded-lg overflow-hidden border border-input-border/50">
                      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        autoFocus
                        placeholder="Search country..."
                        className="w-full bg-transparent pl-9 pr-3 py-2.5 text-xs focus:outline-none text-foreground font-semibold placeholder:text-muted-foreground"
                        value={search}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
              </div>
              <ScrollArea className="h-[300px]">
                  <div className="flex flex-col gap-1 pr-6 pb-2">
                      {filteredCountries.map((c) => {
                          const CountryFlag = Flags[c.code];
                          const isActive = isoCode === c.code;
                          return (
                              <button
                                key={`${c.code}-${c.dial}`}
                                type="button"
                                onClick={() => {
                                  onChange({ countryCode: c.dial, isoCode: c.code, phone: "" });
                                  setOpen(false);
                                  setSearchQuery("");
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                                  isActive 
                                    ? "bg-foreground text-background shadow-lg scale-[1.02]" 
                                    : "text-foreground hover:bg-muted"
                                )}
                              >
                                <span className="flex items-center gap-3 pointer-events-none overflow-hidden flex-1">
                                  <div className="flex h-3 w-5 overflow-hidden rounded-[1px] border border-white/10 shrink-0">
                                      {CountryFlag && <CountryFlag />}
                                  </div>
                                  <span className="truncate">{c.name}</span>
                                </span>
                                <span className={cn(
                                  "pointer-events-none shrink-0 tabular-nums text-right min-w-[60px] text-[11px]", 
                                  isActive ? "text-background/70" : "text-muted-foreground"
                                )}>
                                    {c.dial}
                                </span>
                              </button>
                          );
                      })}
                  </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Numeric Input with libphonenumber-js Formatting */}
          <input
            className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-medium"
            placeholder="Phone Number"
            type="text"
            value={phone}
            onChange={(e) => {
              const inputVal = e.target.value;
              
              // Use AsYouType with the raw input to track state and handle deletion correctly
              // We pass inputVal directly to let libphonenumber-js handle the sequence of characters
              const formatter = new AsYouType(isoCode);
              const formatted = formatter.input(inputVal);
              
              // Extract digits for length limit checking (max 15 per E.164)
              const digits = inputVal.replace(/\D/g, "");
              
              if (digits.length <= 15) {
                  onChange({ phone: formatted });
              }
            }}
          />
      </div>
    </div>
  );
};

export default PhoneInputField;

