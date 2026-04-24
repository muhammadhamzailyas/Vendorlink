import React from "react";
import { formatStatusLabel, STATUS_VARIANT_MAP } from "../../lib/status";
import { Badge } from "../ui/Badge";
import { cn } from "@/lib/cn";

const StatusChip = ({ status, size = "small", className = "" }) => {
  const variant = STATUS_VARIANT_MAP[status?.toLowerCase()] || "outline";
  const sizeClasses = size === "small" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <Badge
      variant={variant}
      className={cn(
        "font-bold uppercase tracking-widest rounded-lg",
        sizeClasses,
        className
      )}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
};

export default StatusChip;



