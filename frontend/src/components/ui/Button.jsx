import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/20 disabled:pointer-events-none disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-[var(--foreground)] text-[var(--background)] shadow-soft hover:opacity-90 active:bg-[var(--muted)] active:text-[var(--foreground)] active:scale-[0.98]",
        secondary: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs hover:bg-[var(--muted)] active:bg-[var(--background)] active:scale-[0.98]",
        danger: "border border-[var(--error)] text-[var(--error)] hover:bg-[var(--error)]/5 active:bg-[var(--error)]/10 active:scale-[0.98]",
        success: "border border-[var(--success)] text-[var(--success)] hover:bg-[var(--success)]/5 active:bg-[var(--success)]/10 active:scale-[0.98]",
        warning: "border border-[var(--warning)] text-[var(--warning)] hover:bg-[var(--warning)]/5 active:bg-[var(--warning)]/10 active:scale-[0.98]",
        ghost: "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)] active:bg-[var(--muted)] active:scale-[0.95]",
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
