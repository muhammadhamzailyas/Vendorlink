import * as React from "react"
import { cn } from "../../lib/cn"

export const Typography = React.forwardRef(
  ({ className, variant = "body", as: Component, ...props }, ref) => {
    const variants = {
      h1: "text-h1 font-bold tracking-tight",
      h2: "text-h2 font-semibold tracking-tight",
      h3: "text-h3 font-semibold tracking-tight",
      body: "text-body leading-relaxed",
      helper: "text-helper leading-none",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-muted-foreground",
    }

    const defaultComponents = {
      h1: "h1",
      h2: "h2",
      h3: "h3",
      body: "p",
      helper: "span",
      large: "div",
      small: "small",
      muted: "p",
    }

    const Tag = Component || defaultComponents[variant] || "p"

    return (
      <Tag
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"



