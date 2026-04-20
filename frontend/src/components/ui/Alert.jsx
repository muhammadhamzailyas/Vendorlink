import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/cn"

const alertVariants = cva(
  "relative w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "text-[var(--foreground)] [&>svg]:text-[var(--muted-foreground)]",
        destructive:
          "text-[var(--foreground)] [&>svg]:text-[var(--error)]",
        success: 
          "text-[var(--foreground)] [&>svg]:text-[var(--success)]",
        warning:
          "text-[var(--foreground)] [&>svg]:text-[var(--warning)]",
        info:
          "text-[var(--foreground)] [&>svg]:text-[var(--info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold uppercase tracking-tight leading-none text-[var(--foreground)]", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs [&_p]:leading-relaxed font-medium text-[var(--muted-foreground)]", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
