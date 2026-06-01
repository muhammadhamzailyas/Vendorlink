import React from "react";
import { cn } from "@/lib/cn";

const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border bg-card text-foreground shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = "Card";

Card.Header = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 border-b border-border px-5 py-4 sm:px-6", className)} {...props} />
));

Card.Header.displayName = "CardHeader";

Card.Title = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
));

Card.Title.displayName = "CardTitle";

Card.Description = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />
));

Card.Description.displayName = "CardDescription";

Card.Content = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-5 py-4 sm:px-6", className)} {...props} />
));

Card.Content.displayName = "CardContent";

Card.Footer = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center border-t border-border px-5 py-3.5 sm:px-6", className)} {...props} />
));

Card.Footer.displayName = "CardFooter";

export default Card;




