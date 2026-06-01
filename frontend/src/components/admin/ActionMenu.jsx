import React from "react";
import {
  DotsThreeVertical as MoreVert,
  CircleNotch,
} from "@phosphor-icons/react";
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui";
import { cn } from "@/lib/cn";

const ActionMenu = ({
  loading = false,
  items = [],
  align = "end",
  className,
  triggerClassName,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={loading}
          className={cn("h-8 w-8 rounded-full", triggerClassName)}
        >
          {loading ? (
            <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <MoreVert className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("w-48 p-1.5", className)}>
        {items.map((item, index) => {
          if (item.type === "separator") {
            return <DropdownMenuSeparator key={`sep-${index}`} className="my-1.5 bg-border/50" />;
          }

          if (item.hidden) return null;

          return (
            <DropdownMenuItem 
              key={item.label}
              onClick={item.onClick}
              disabled={item.disabled || loading}
              className={cn(
                "rounded-lg font-bold uppercase tracking-tight text-[11px] cursor-pointer",
                item.variant === "danger" 
                  ? "text-danger focus:text-danger focus:bg-danger-surface" 
                  : "text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted",
                item.className
              )}
            >
              {item.icon && <item.icon className="mr-2 w-4 h-4" />}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionMenu;
