import React from "react";
import { cn } from "@/lib/cn";

const Skeleton = ({ className, ...props }) => (
  <div className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />
);

Skeleton.Card = ({ className }) => (
  <div
    className={cn(
      "rounded-xl border border-border bg-card p-5 space-y-3",
      className
    )}
  >
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

Skeleton.TableRow = ({ cols = 6 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-3 w-full" />
      </td>
    ))}
  </tr>
);

Skeleton.Page = ({ rows = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton.Card key={i} />
    ))}
  </div>
);

Skeleton.Stat = () => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-2.5">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-28" />
    <Skeleton className="h-3 w-16" />
  </div>
);

Skeleton.StatGrid = ({ count = 4 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton.Stat key={i} />
    ))}
  </div>
);

export default Skeleton;




