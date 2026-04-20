import React from "react";
import { cn } from "../../lib/cn";
import { Archive } from "@phosphor-icons/react";

const EmptyState = ({
  // eslint-disable-next-line no-unused-vars
  icon: Icon = Archive,
  title = "Nothing here yet",
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-14 text-center sm:px-8 sm:py-16",
      className
    )}
  >
    <div className="mb-4 rounded-xl bg-[var(--muted)] p-4">
      <Icon className="h-7 w-7 text-[var(--foreground)]" />
    </div>
    <p className="text-base font-semibold text-[var(--foreground)]">{title}</p>
    {description && (
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
