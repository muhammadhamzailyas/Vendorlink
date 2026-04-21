import React, { useState, useMemo } from "react";
import { CaretDown, MagnifyingGlass, Check } from "@phosphor-icons/react";
import { Popover, PopoverTrigger, PopoverContent, ScrollArea } from "../../ui";
import { cn } from "@/lib/cn";

const MagnifyingGlassableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className,
  searchPlaceholder = "MagnifyingGlass options..." 
}) => {
  const [open, setOpen] = useState(false);
  const [search, setMagnifyingGlass] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl bg-[var(--muted)] px-4 text-sm transition-all focus:ring-2 focus:ring-primary/20",
            !value && "text-[var(--muted-foreground)]/60",
            value && "text-[var(--foreground)] font-medium",
            className
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <CaretDown className={cn("h-4 w-4 shrink-0 text-[var(--muted-foreground)]/60 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-[var(--border)] shadow-xl rounded-xl overflow-hidden" align="start">
        <div className="p-2 border-b border-[var(--border)]/50 bg-[var(--muted)]/30">
          <div className="relative">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input 
              autoFocus
              placeholder={searchPlaceholder}
              className="w-full bg-transparent pl-8 pr-3 py-2 text-xs focus:outline-none text-[var(--foreground)] font-medium"
              value={search}
              onChange={(e) => setMagnifyingGlass(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="h-[250px]">
          <div className="p-1">
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setMagnifyingGlass("");
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left",
                  value === opt.value ? "bg-[var(--foreground)] text-[var(--foreground)]" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                )}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--muted-foreground)] font-medium">No results found</div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default MagnifyingGlassableSelect;
