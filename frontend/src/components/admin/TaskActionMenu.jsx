import React from "react";
import {
  DotsThreeVertical as MoreVert,
  Eye as Visibility,
  CircleNotch,
} from "@phosphor-icons/react";
import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "../ui";

const TaskActionMenu = ({
  actionLoading,
  onView,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={actionLoading}
        className="h-8 w-8 rounded-full"
      >
        {actionLoading ? (
          <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <MoreVert className="w-5 h-5" />
        )}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 p-1.5">
      <DropdownMenuItem 
        onClick={onView}
        className="rounded-lg font-bold uppercase tracking-tight text-[11px] text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted cursor-pointer"
      >
        <Visibility className="mr-2 w-4 h-4" /> Show Details
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default TaskActionMenu;
