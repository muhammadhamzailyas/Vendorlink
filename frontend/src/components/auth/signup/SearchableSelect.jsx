import React, { useState, useMemo } from "react";
import { CaretDown, MagnifyingGlass, Check } from "@phosphor-icons/react";
import { Popover, PopoverTrigger, PopoverContent, ScrollArea, Button, ErrorBanner } from "../../ui";
import { cn } from "@/lib/cn";

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className,
  error,
  searchPlaceholder = "Search options...",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter(opt => 
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="w-full">
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className={cn(
                "flex h-12 w-full items-center justify-between rounded-xl border border-input-border bg-input-bg px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-input-focus/15 focus:border-input-focus disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-input-bg !normal-case !tracking-normal",
                !value && "text-muted-foreground",
                value && "text-foreground font-medium",
                error && "border-error focus:ring-error/15",
                className
            )}
            >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <CaretDown className="h-4 w-4 text-muted-foreground ml-2" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border shadow-xl rounded-xl overflow-hidden" align="start">
            <div className="p-2 border-b border-border/50 bg-muted/30">
            <div className="relative">
                <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input 
                autoFocus
                placeholder={searchPlaceholder}
                className="w-full bg-transparent pl-8 pr-3 py-2 text-xs focus:outline-none text-foreground font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                    setSearch("");
                    }}
                    className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left",
                    value === opt.value ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                    )}
                >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check className="h-3.5 w-3.5" />}
                </button>
                ))}
                {filteredOptions.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground font-medium">No results found</div>
                )}
            </div>
            </ScrollArea>
        </PopoverContent>
        </Popover>
        <ErrorBanner error={error} />
    </div>
  );
};

export default SearchableSelect;
