import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

const Dialog = React.forwardRef(
  ({ open = false, onX, className, children, ...props }, ref) => (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onX?.();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[var(--border)]/50 bg-[var(--card)] shadow-soft",
            "sm:max-w-lg animate-in fade-in zoom-in-95 duration-200",
            className
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
);

Dialog.displayName = "Dialog";

const DialogHeader = React.forwardRef(
  ({ className, onX, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between gap-3 border-b border-[var(--border)]/50 px-6 py-5 bg-[var(--muted)]/30", className)}
      {...props}
    >
      <div className="flex-1">
        {typeof children === "string" ? (
          <DialogPrimitive.Title className="text-base font-extrabold tracking-tight text-[var(--foreground)] uppercase">
            {children}
          </DialogPrimitive.Title>
        ) : (
          children
        )}
      </div>
      {onX && (
        <DialogPrimitive.Close asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onX}
            className="shrink-0"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
);

DialogHeader.displayName = "DialogHeader";

const DialogFooter = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse justify-end gap-3 border-t border-[var(--border)]/50 px-6 py-4 sm:flex-row sm:items-center bg-[var(--muted)]/30", className)}
      {...props}
    >
      {children}
    </div>
  )
);

DialogFooter.displayName = "DialogFooter";

const DialogBody = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4 px-5 py-4 sm:px-6", className)} {...props}>
      {children}
    </div>
  )
);

DialogBody.displayName = "DialogBody";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold tracking-tight text-[var(--foreground)]", className)}
    {...props}
  />
));

DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-[var(--muted-foreground)]", className)}
    {...props}
  />
));

DialogDescription.displayName = "DialogDescription";

Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Body = DialogBody;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;

export default Dialog;
