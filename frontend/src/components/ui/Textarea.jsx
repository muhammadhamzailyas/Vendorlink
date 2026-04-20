import React from "react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

const Textarea = React.forwardRef(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <Label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]/80"
          >
            {label}
          </Label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "flex min-h-[96px] w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] shadow-xs transition-colors placeholder:text-[var(--muted-foreground)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus)]/15 focus-visible:border-[var(--input-focus)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--muted)] disabled:opacity-50",
            error && "border-[var(--error)] focus-visible:ring-[var(--error)]/15",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
