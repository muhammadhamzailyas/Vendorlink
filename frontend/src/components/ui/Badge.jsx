import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
        success: "border-badge-green-border bg-badge-green-bg text-badge-green-text",
        warning: "border-badge-amber-border bg-badge-amber-bg text-badge-amber-text",
        info: "border-badge-blue-border bg-badge-blue-bg text-badge-blue-text",
        error: "border-badge-red-border bg-badge-red-bg text-badge-red-text",
        destructive: "border-badge-red-border bg-badge-red-bg text-badge-red-text shadow-sm",
        purple: "border-badge-purple-border bg-badge-purple-bg text-badge-purple-text",
        teal: "border-badge-teal-border bg-badge-teal-bg text-badge-teal-text",
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



