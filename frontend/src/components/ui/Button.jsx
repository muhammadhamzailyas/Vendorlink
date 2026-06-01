import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { CircleNotch } from "@phosphor-icons/react";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background shadow-soft hover:opacity-90 active:bg-muted active:text-foreground active:scale-[0.98]",
        default: "bg-foreground text-background shadow-soft hover:opacity-90 active:bg-muted active:text-foreground active:scale-[0.98]",
        secondary: "bg-transparent border border-foreground text-foreground hover:bg-foreground/5 active:scale-[0.98]",
        destructive: "bg-transparent border border-error text-error hover:bg-error/5 active:scale-[0.98]",
        danger: "bg-transparent border border-error text-error hover:bg-error/5 active:scale-[0.98]",
        success: "bg-transparent border border-success text-success hover:bg-success/5 active:scale-[0.98]",
        warning: "bg-transparent border border-warning text-warning hover:bg-warning/5 active:scale-[0.98]",
        outline: "bg-transparent border border-border text-foreground hover:bg-muted active:scale-[0.98]",
        ghost: "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted active:scale-[0.95]",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      className,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const childContent =
      asChild && React.isValidElement(children) ? children.props.children : children;
    const loadingSuffix =
      loading && typeof childContent === "string" && !childContent.endsWith("...") ? "..." : null;
    const content = (
      <>
        {loading && <CircleNotch className="h-4 w-4 animate-spin shrink-0" />}
        {childContent}
        {loadingSuffix}
      </>
    );

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), "cursor-pointer gap-2", className)}
        {...props}
      >
        {asChild && React.isValidElement(children)
          ? React.cloneElement(children, { ...children.props, children: content })
          : content}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
