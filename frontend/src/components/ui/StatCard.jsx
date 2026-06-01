import React from "react";
import { cn } from "@/lib/cn";
import Card from "./Card";
import Skeleton from "./Skeleton";

export const StatCard = ({
  title,
  value,
  icon,
  loading = false,
  className,
  trend,
  noHover = false,
}) => {
  return (
    <Card
      className={cn(
        "relative transition-all duration-300 shadow-soft border-border bg-card overflow-hidden",
        className
      )}
    >
      <Card.Header className="flex flex-row items-start justify-between pb-2 space-y-0 px-5 pt-5 border-b-0">
        <p className="text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
          {title}
        </p>
        {icon && !loading && (
          <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-all duration-300 shadow-sm border border-border",
              !noHover && "group-hover:scale-110"
          )}>
            {React.cloneElement(icon, {
              size: 18,
              strokeWidth: 2.5,
            })}
          </div>
        )}
      </Card.Header>
      <Card.Content className="px-5 pb-5">
        <div className="flex flex-col gap-1">
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-lg bg-muted" />
          ) : (
            <>
                <p className="text-2xl font-extrabold tracking-tighter text-foreground uppercase">
                {value}
                </p>
                {trend && <div>{trend}</div>}
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};
