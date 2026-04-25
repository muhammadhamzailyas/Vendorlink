import React from "react";
import {
  DotsThreeVertical as MoreVert,
  Eye as Visibility,
  Prohibit,
  Trash,
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

const UserActionMenu = ({
  user,
  actionLoading,
  onView,
  onSuspend,
  onArchive,
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
        <Visibility className="mr-2 w-4 h-4" /> View Details
      </DropdownMenuItem>

      {user?.role !== "admin" && (
        <>
          <DropdownMenuItem 
            onClick={onSuspend}
            disabled={actionLoading}
            className="rounded-lg font-bold uppercase tracking-tight text-[11px] text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted cursor-pointer"
          >
            <Prohibit className="mr-2 w-4 h-4" /> Deactivate
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5 bg-border/50" />
          <DropdownMenuItem 
            onClick={onArchive}
            disabled={actionLoading}
            className="rounded-lg font-bold uppercase tracking-tight text-[11px] text-danger focus:text-danger focus:bg-danger-surface cursor-pointer"
          >
            <Trash className="mr-2 w-4 h-4" /> Delete User
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default UserActionMenu;



