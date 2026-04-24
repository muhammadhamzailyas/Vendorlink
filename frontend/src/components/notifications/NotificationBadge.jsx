import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { Bell } from "@phosphor-icons/react";
import { formatDate } from "../../lib/dateUtils";
import { Button, Card, Popover, PopoverContent, PopoverTrigger, ScrollArea, Separator, Badge } from "../ui";
import { cn } from "@/lib/cn";

import { useUser } from "../../context/UserContext";

const priorityDot = {
  urgent: "bg-error",
  high: "bg-warning",
  normal: "bg-foreground",
  low: "bg-border",
};

const NotificationBadge = ({ className }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { user } = useUser();

  const getRole = () => user?.role || "";

  const recent = notifications.slice(0, 5);

  const handleClick = async (n) => {
    if (!n.read) await markAsRead(n._id);
    // Navigate based on notification data
    const role = getRole();
    if (n.data?.contractId) {
      navigate(`/${role}/contract/${n.data.contractId}`);
    } else if (n.data?.taskId) {
      navigate(`/${role}/task/${n.data.taskId}`);
    } else {
      navigate(`/${role}/notifications`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("relative h-9 w-9 p-0 rounded-xl hover:bg-muted", className)}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1 ring-2 ring-background border-none p-0"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden shadow-soft border-border/50">
        <div className="flex items-center justify-between px-5 py-4 bg-muted/30">
          <span className="text-xs font-extrabold text-foreground uppercase tracking-tight">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{unreadCount} unread</span>
          )}
        </div>
        <Separator />

        {recent.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm font-medium text-muted-foreground">No notifications</div>
        ) : (
          <ScrollArea className="max-h-80">
            {recent.map((n) => (
              <Button
                key={n._id}
                variant="ghost"
                onClick={() => handleClick(n)}
                className={cn(
                  "group w-full h-auto flex items-start justify-start gap-3 px-5 py-4 border-b border-border/50 text-left transition-colors hover:bg-muted/50 rounded-none",
                  !n.read ? "bg-muted/30" : "bg-card"
                )}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 shadow-sm ${priorityDot[n.priority] || priorityDot.normal}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground truncate group-hover:text-foreground transition-colors">{n.title}</p>
                  <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter mt-1.5">{formatDate(n.createdAt)}</p>
                </div>
              </Button>
            ))}
          </ScrollArea>
        )}

        <Separator />
        <Button
          variant="ghost"
          onClick={() => navigate(`/${getRole()}/notifications`)}
          className="w-full h-auto py-3.5 text-center text-[11px] font-extrabold text-muted-foreground uppercase tracking-tight bg-muted/30 hover:bg-muted hover:text-foreground transition-all rounded-none"
        >
          View All Notifications
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBadge;


