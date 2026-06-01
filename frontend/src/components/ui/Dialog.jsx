import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

const DialogRoot = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, onX, persistent, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onPointerDownOutside={(e) => { if (persistent) e.preventDefault(); }}
      onEscapeKeyDown={(e) => { if (persistent) e.preventDefault(); }}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border/50 bg-card shadow-soft sm:max-w-lg animate-in fade-in zoom-in-95 duration-200",
        className
      )}
      {...props}
    >
      {children}
      {onX && (
        <DialogPrimitive.Close
          onClick={onX}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center border-b border-border/50 px-6 py-5 bg-muted/30",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  children,
  ...props
}) => {
  const count = React.Children.count(children);
  const gridCols = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-1";

  return (
    <div
      className={cn(
        "grid gap-4 w-full border-t border-border/50 px-6 py-4 bg-muted/30",
        gridCols,
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: cn("w-full", child.props.className)
          });
        }
        return child;
      })}
    </div>
  );
};
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-base font-extrabold tracking-tight text-foreground uppercase",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogBody = ({ className, ...props }) => (
  <div className={cn("space-y-4 px-5 py-4 sm:px-6", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

// Legacy wrapper that many components depend on
const Dialog = React.forwardRef(
  ({ open = false, onX, className, children, ...props }, ref) => (
    <DialogRoot open={open} onOpenChange={(val) => !val && onX?.()}>
      <DialogContent onX={onX} className={className} ref={ref} {...props}>
        {children}
      </DialogContent>
    </DialogRoot>
  )
);
Dialog.displayName = "Dialog";
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Body = DialogBody;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;

export {
  Dialog,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};

export default Dialog;




