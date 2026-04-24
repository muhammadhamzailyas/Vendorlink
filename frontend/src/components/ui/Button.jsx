import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background shadow-soft hover:opacity-90 active:bg-muted active:text-foreground active:scale-[0.98]",
        secondary: "border border-border bg-card text-foreground shadow-xs hover:bg-muted active:bg-background active:scale-[0.98]",
        danger: "border border-error text-error hover:bg-error/5 active:bg-error/10 active:scale-[0.98]",
        success: "border border-success text-success hover:bg-success/5 active:bg-success/10 active:scale-[0.98]",
        warning: "border border-warning text-warning hover:bg-warning/5 active:bg-warning/10 active:scale-[0.98]",
        ghost: "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted active:scale-[0.95]",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-lg",
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
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
      icon,
      className,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const adornment = loading ? (
      <CircleNotch className="h-4 w-4 animate-spin" />
    ) : icon ? (
      <span className="shrink-0">{icon}</span>
    ) : null;

    if (asChild) {
      const child = React.Children.only(children);
      const mergedChildren = adornment ? (
        <>
          {adornment}
          {child.props.children}
        </>
      ) : (
        child.props.children
      );

      return (
        <Comp
          ref={ref}
          disabled={disabled || loading}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {React.cloneElement(child, undefined, mergedChildren)}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {adornment}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };



