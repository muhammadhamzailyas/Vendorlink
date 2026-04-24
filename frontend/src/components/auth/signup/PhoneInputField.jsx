import React, { useState, useMemo } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Popover, PopoverTrigger, PopoverContent, ScrollArea } from "../../ui";
import { cn } from "@/lib/cn";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
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
  const [search, setMagnifyingGlass] = useState("");

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
          "flex h-12 w-full items-stretch overflow-hidden rounded-xl bg-input-bg transition-all",
          "border border-input-border focus-within:ring-2 focus-within:ring-input-focus/15 focus-within:border-input-focus focus-within:shadow-soft"
        )}
      >
          {/* Custom Popover Country Selector (themed) */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button 
                type="button"
                className="flex items-center gap-2 border-r border-input-border/50 bg-muted/20 px-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-3.5 w-5 overflow-hidden rounded-sm border border-border/10 bg-muted shrink-0">
                    {SelectedFlag ? <SelectedFlag /> : <span className="text-[8px]">{isoCode}</span>}
                </div>
                <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">{countryCode}</span>
                <CaretDown className={cn("h-3.5 w-3.5 text-muted-foreground/60 transition-transform shrink-0", open && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-2 bg-popover border-border shadow-xl rounded-2xl overflow-hidden" align="start">
              <div className="mb-2 p-1">
                  <div className="relative bg-muted/50 rounded-lg overflow-hidden border border-border/50">
                      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <input 
                        autoFocus
                        placeholder="MagnifyingGlass country..."
                        className="w-full bg-transparent pl-9 pr-3 py-2.5 text-xs focus:outline-none text-foreground font-semibold"
                        value={search}
                        onChange={(e) => setMagnifyingGlass(e.target.value)}
                      />
                  </div>
              </div>
              <ScrollArea className="h-[300px]">
                  <div className="flex flex-col gap-1 pr-6 pb-2"> {/* Significant right padding to clear scrollbar */}
                      {filteredCountries.map((c) => {
                          const CountryFlag = Flags[c.code];
                          return (
                              <button
                                key={`${c.code}-${c.dial}`}
                                type="button"
                                onClick={() => {
                                  onChange({ countryCode: c.dial, isoCode: c.code });
                                  setOpen(false);
                                  setMagnifyingGlass("");
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                                  isoCode === c.code ? "bg-foreground text-foreground shadow-md" : "text-foreground hover:bg-muted"
                                )}
                              >
                                <span className="flex items-center gap-3 pointer-events-none overflow-hidden flex-1">
                                  <div className="flex h-3 w-5 overflow-hidden rounded-[1px] border border-border/10 shrink-0">
                                      {CountryFlag && <CountryFlag />}
                                  </div>
                                  <span className="truncate">{c.name}</span>
                                </span>
                                <span className={cn("pointer-events-none shrink-0 tabular-nums text-right min-w-[60px] text-[11px]", isoCode === c.code ? "text-foreground" : "text-muted-foreground")}>
                                    {c.dial}
                                </span>
                              </button>
                          );
                      })}
                  </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Numeric Input with Formatting */}
          <input
            className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-medium"
            placeholder="Phone Number"
            type="text"
            value={phone}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, ""); // Keep only digits
              
              // Apply formatting based on ISO code
              if (isoCode === "PK") {
                if (val.length > 3) {
                  val = val.slice(0, 3) + "-" + val.slice(3, 10);
                }
              } else {
                // Generic formatting for other countries (e.g., groups of 3 or 4)
                if (val.length > 3 && val.length <= 6) {
                  val = val.slice(0, 3) + " " + val.slice(3);
                } else if (val.length > 6) {
                  val = val.slice(0, 3) + " " + val.slice(3, 6) + " " + val.slice(6, 10);
                }
              }
              
              onChange({ phone: val });
            }}
          />
      </div>
    </div>
  );
};

export default PhoneInputField;



