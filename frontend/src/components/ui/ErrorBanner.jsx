import React from "react";
import { cn } from "@/lib/cn";

export const ErrorBanner = ({ error, className }) => {
  if (!error) return null;
  
  return (
    <div className={cn(
      "mt-2 flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-[11px] font-bold tracking-tight text-error animate-in fade-in slide-in-from-top-1 border border-error/20",
      className
    )}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,16,0v40A8,8,0,0,1,144,176ZM128,80a12,12,0,1,1-12,12A12,12,0,0,1,128,80Z"></path>
      </svg>
      <span className="leading-none">{error}</span>
    </div>
  );
};
