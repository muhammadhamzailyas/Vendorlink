import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]",
        outline: "border-[var(--border)] text-[var(--foreground)]",
        success: "border-[var(--badge-green-border)] bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
        warning: "border-[var(--badge-amber-border)] bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]",
        info: "border-[var(--badge-blue-border)] bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]",
        error: "border-[var(--badge-red-border)] bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
        destructive: "border-[var(--badge-red-border)] bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] shadow-sm",
        purple: "border-[var(--badge-purple-border)] bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
        teal: "border-[var(--badge-teal-border)] bg-[var(--badge-teal-bg)] text-[var(--badge-teal-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants };
