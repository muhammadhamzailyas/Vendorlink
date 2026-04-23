import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-bold uppercase tracking-widest ring-offset-background transition-colors hover:bg-[var(--muted)]/50 hover:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/20 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[var(--muted)] data-[state=on]:text-[var(--foreground)]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-[var(--border)]/50 bg-transparent hover:bg-[var(--muted)]/50 hover:text-[var(--muted-foreground)]",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
