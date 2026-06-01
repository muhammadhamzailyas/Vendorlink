import React from "react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";
import { ErrorBanner } from "./ErrorBanner";

const Textarea = React.forwardRef(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <Label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-foreground/80"
          >
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex min-h-[96px] w-full rounded-xl border border-input-border bg-input-bg px-4 py-3 text-sm text-foreground shadow-xs transition-all duration-200 placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-input-focus/15 focus-visible:border-input-focus focus-visible:shadow-soft",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50",
            error && "border-error focus-visible:ring-error/15",
            className
          )}
          {...props}
        />
        <ErrorBanner error={error} />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;



