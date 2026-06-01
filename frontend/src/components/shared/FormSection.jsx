import React from "react";
import { cn } from "../../lib/cn";
import { Card } from "../ui";

const FormSection = ({
  title,
  description,
  actions,
  footer,
  className,
  contentClassName,
  children,
}) => {
  return (
    <Card className={cn("shadow-soft border-border/50", className)}>
      {title || description || actions ? (
        <Card.Header className="gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-border/50">
          <div className="min-w-0">
            {title ? <Card.Title className="text-base font-extrabold tracking-tight text-foreground uppercase">{title}</Card.Title> : null}
            {description ? <Card.Description className="mt-0.5 text-[13px] font-medium text-muted-foreground">{description}</Card.Description> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
        </Card.Header>
      ) : null}

      <Card.Content className={cn("space-y-6 p-6", contentClassName)}>{children}</Card.Content>

      {footer ? <Card.Footer className="flex-wrap justify-end gap-3 px-6 py-4 bg-muted/30 border-t border-border/50">{footer}</Card.Footer> : null}
    </Card>
  );
};

export const FormActionRow = ({ className, children }) => {
  const count = React.Children.count(children);
  const gridCols = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-4"; // Handle more just in case

  return (
    <div className={cn("grid gap-4 w-full items-center justify-stretch", gridCols, className)}>
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

export const FormFieldGrid = ({ className, children }) => (
  <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5", className)}>{children}</div>
);

export default FormSection;


