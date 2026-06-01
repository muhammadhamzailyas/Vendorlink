import React from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

const Select = React.forwardRef(
  ({ label, error, options = [], placeholder, className, id, children, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <Label
            htmlFor={selectId}
            className="mb-1.5 block text-[13px] font-bold tracking-tight text-foreground/80 uppercase"
          >
            {label}
          </Label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "flex h-11 w-full appearance-none rounded-xl border border-input-border bg-input-bg px-4 py-2 pr-10 text-sm text-foreground shadow-xs transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus/15 focus-visible:border-input-focus focus-visible:shadow-soft",
              "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
              error && "border-error focus-visible:ring-error/15",
              className
            )}
            {...props}
          >
            {children || (
              <>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => {
                  const value = typeof opt === "string" ? opt : opt.value;
                  const optionLabel = typeof opt === "string" ? opt : opt.label;
                  return (
                    <option key={value} value={value}>
                      {optionLabel}
                    </option>
                  );
                })}
              </>
            )}
          </select>
          <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;




