import React from "react";
import { cn } from "@/lib/cn";

export const DetailLabel = ({ children, className }) => (
  <span className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground", className)}>
    {children}
  </span>
);

export const DetailItem = ({ label, value, icon: Icon, className }) => (
  <div className={cn("space-y-2", className)}>
    <DetailLabel className="flex items-center gap-2">
      {Icon && <Icon size={12} weight="bold" />}
      {label}
    </DetailLabel>
    <div className="text-sm font-bold text-foreground bg-muted/30 px-4 py-3 rounded-xl border border-border/50 min-h-[44px] flex items-center">
      {value || "N/A"}
    </div>
  </div>
);
