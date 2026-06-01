import React from "react";
import { cn } from "@/lib/cn";

const DetailField = ({
  label,
  children,
  className = "",
  labelClassName = "",
  valueClassName = "",
  colSpan = 1
}) => {
  const isReactElement = React.isValidElement(children);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-muted/30 px-4 py-3.5 shadow-xs transition-all duration-300 hover:shadow-soft",
        colSpan === 2 && "sm:col-span-2",
        className
      )}
    >
      <p
        className={cn(
          "text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1",
          labelClassName
        )}
      >
        {label}
      </p>
      {isReactElement ? (
        children
      ) : (
        <div className={cn("text-sm font-extrabold tracking-tight text-foreground", valueClassName)}>
          {children}
        </div>
      )}
    </div>
  );
};

export { DetailField };



