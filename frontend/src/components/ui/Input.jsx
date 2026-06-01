import React from "react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";
import { ErrorBanner } from "./ErrorBanner";

const Input = React.forwardRef(
  ({ label, error, className, id, type, numericOnly, icon, onKeyDown, ...props }, ref) => {
    const inputId = id || props.name;

    const handleKeyDown = (e) => {
      if (numericOnly) {
        // Allow: backspace, delete, tab, escape, enter, .
        if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
             // Allow: Ctrl+A, Command+A
            (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) || 
             // Allow: home, end, left, right, down, up
            (e.keyCode >= 35 && e.keyCode <= 40)) {
                 return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
      }
      if (onKeyDown) onKeyDown(e);
    };

    return (
      <div className="w-full">
        {label && (
          <Label
            htmlFor={inputId}
            className="mb-1.5 block text-[13px] font-bold tracking-tight text-foreground/80 uppercase"
          >
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-muted-foreground/60 z-10 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex h-12 w-full rounded-xl border border-input-border bg-input-bg px-4 py-2 text-sm text-foreground shadow-xs transition-all duration-200 placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus/15 focus-visible:border-input-focus focus-visible:shadow-soft",
              "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
              icon && "pl-11",
              error && "border-error focus-visible:ring-error/15",
              numericOnly && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              className
            )}
            {...props}
          />
        </div>
        <ErrorBanner error={error} />
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

