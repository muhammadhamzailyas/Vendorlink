import React from "react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

const Input = React.forwardRef(
  ({ label, error, className, id, type, numericOnly, onKeyDown, ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          type={type}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-12 w-full rounded-xl border border-input-border bg-input-bg px-4 py-2 text-sm text-foreground shadow-xs transition-all duration-200 placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus/15 focus-visible:border-input-focus focus-visible:shadow-soft",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
            error && "border-error focus-visible:ring-error/15",
            numericOnly && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
          {...props}
        />
        {error && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-[11px] font-bold uppercase tracking-tight text-error animate-in fade-in slide-in-from-top-1 border border-error/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,16,0v40A8,8,0,0,1,144,176ZM128,80a12,12,0,1,1-12,12A12,12,0,0,1,128,80Z"></path>
            </svg>
            <span className="leading-none">{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;



