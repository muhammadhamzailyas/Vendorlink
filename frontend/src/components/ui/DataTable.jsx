import React from "react";
import { Button } from "./Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./Table";

export const DataTable = ({
  columns,
  data,
  title,
  subtitle,
  icon,
  action,
  showSectionHeader = false,
  showTableHeader = true,
  sectionClassName = "overflow-hidden rounded-xl border border-border bg-card shadow-soft",
  sectionHeaderClassName = "border-b border-border bg-card px-5 py-5 sm:px-6",
  contentWrapperClassName = "overflow-x-auto [-webkit-overflow-scrolling:touch]",
  rowKey = "_id",
  emptyState,
  emptyColSpan,
  tableClassName = "w-full min-w-[720px]",
  headClassName = "bg-muted",
  bodyClassName = "divide-y divide-border/50",
  rowClassName = "transition-all duration-200 hover:bg-muted/50 hover:translate-x-[1px]",
  emptyCellClassName = "px-6 py-12 text-center text-sm text-muted-foreground sm:py-16",
  showRowActions = false,
  rowActions = [],
  actionsHeaderLabel = "Actions",
  actionsHeaderClassName = "px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
  actionsCellClassName = "px-6 py-4",
}) => {
  const getRowKey = (row, index) => {
    if (typeof rowKey === "function") return rowKey(row, index);
    return row?.[rowKey] ?? index;
  };

  const resolvedEmptyColSpan = emptyColSpan || columns.length + (showRowActions ? 1 : 0) || 1;

  const resolveRowActions = (row, index) => {
    const candidate = typeof rowActions === "function" ? rowActions(row, index) : rowActions;
    if (!Array.isArray(candidate)) return [];
    return candidate.filter((action) => action && !action.hidden);
  };

  const tableMarkup = (
    <Table className={tableClassName}>
      {showTableHeader && (
        <TableHeader className={headClassName}>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.headerClassName || "px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"}
              >
                {column.label}
              </TableHead>
            ))}
            {showRowActions && (
              <TableHead className={actionsHeaderClassName}>{actionsHeaderLabel}</TableHead>
            )}
          </TableRow>
        </TableHeader>
      )}
      <TableBody className={bodyClassName}>
        {data.length > 0 ? (
          data.map((row, index) => {
            const actions = resolveRowActions(row, index);

            return (
              <TableRow key={getRowKey(row, index)} className={rowClassName}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.cellClassName || "px-5 py-3.5 text-sm text-foreground/80"}>
                    {typeof column.render === "function" ? column.render(row, index) : row?.[column.key] ?? "-"}
                  </TableCell>
                ))}
                {showRowActions && (
                  <TableCell className={actionsCellClassName}>
                    {actions.length > 0 ? (
                      <div className="grid-cols-1 grid grid-wrap gap-2">
                        {actions.map((action, actionIndex) => (
                          <Button
                            key={action.key || action.label || `action-${actionIndex}`}
                            type="button"
                            title={action.title || action.label}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!action.disabled && typeof action.onClick === "function") {
                                action.onClick(row, index, event);
                              }
                            }}
                            disabled={action.disabled}
                            variant="secondary"
                            size="xs"
                            className={action.className || "h-auto whitespace-nowrap px-2.5 py-1.5 text-xs"}
                          >
                            {action.icon || null}
                            {action.label}
                          </Button>
                        ))}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No actions</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={resolvedEmptyColSpan} className={emptyCellClassName}>
              {emptyState || "No data available."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className={sectionClassName}>
      {showSectionHeader && (
        <div className={sectionHeaderClassName}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {icon && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground shadow-sm border border-border/50">
                  {React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })}
                </div>
              )}
              <div>
                {title && <h3 className="text-base font-extrabold tracking-tight text-foreground uppercase">{title}</h3>}
                {subtitle && <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            {action || null}
          </div>
        </div>
      )}

      <div className={contentWrapperClassName}>{tableMarkup}</div>
    </div>
  );
};




