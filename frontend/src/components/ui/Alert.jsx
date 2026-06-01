import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/cn"

const alertVariants = cva(
  "relative w-full rounded-xl border border-border bg-card px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "text-foreground [&>svg]:text-muted-foreground",
        destructive:
          "text-foreground [&>svg]:text-error",
        success: 
          "text-foreground [&>svg]:text-success",
        warning:
          "text-foreground [&>svg]:text-warning",
        info:
          "text-foreground [&>svg]:text-info",
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
    className={cn("mb-1 font-bold uppercase tracking-tight leading-none text-foreground", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs [&_p]:leading-relaxed font-medium text-muted-foreground", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }




