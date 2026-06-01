import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { Bell, Checks } from "@phosphor-icons/react";
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
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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
    } else if (n.type === 'new_user' || n.type === 'new_user_registered') {
      navigate(`/admin/pending`);
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
          className={cn("relative h-9 w-9 p-0 rounded-xl hover:bg-muted transition-all", className)}
          aria-label="Notifications"
        >
          <Bell size={20} weight="bold" className="text-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-[20px] flex items-center justify-center border-2 border-background p-0 text-[10px] font-bold bg-red-600 text-white shadow-sm tracking-normal">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden shadow-soft border-border/50 rounded-xl bg-card mt-2">
        <div className="flex items-center justify-between px-5 py-4 bg-muted/20">
          <div className="flex flex-col">
            <span className="text-xs font-black text-foreground uppercase tracking-tight">Recent Alerts</span>
            {unreadCount > 0 && (
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{unreadCount} unread items</span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                className="h-7 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted gap-1"
            >
                 Read All
            </Button>
          )}
        </div>
        <Separator className="bg-border/40" />

        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="inline-flex p-3 rounded-full bg-muted/50 mb-3 text-muted-foreground/30">
                <Bell size={24} weight="duotone" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inbox is empty</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            {recent.map((n) => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={cn(
                  "group w-full flex items-start gap-4 px-5 py-4 border-b border-border/30 text-left transition-all hover:bg-muted/30 relative",
                  !n.read ? "bg-muted/10" : "bg-transparent opacity-80"
                )}
              >
                {!n.read && <span className="absolute left-0 top-0 bottom-0 w-1 bg-foreground" />}
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 shadow-sm ${priorityDot[n.priority] || priorityDot.normal}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-foreground leading-tight">{n.title}</p>
                  <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 mt-1">{n.message}</p>
                  <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter mt-2">{formatDate(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        )}

        <Separator className="bg-border/40" />
        <Button
          variant="ghost"
          onClick={() => navigate(`/${getRole()}/notifications`)}
          className="w-full h-auto py-4 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/20 hover:bg-muted hover:text-foreground transition-all rounded-none"
        >
          Open Notification Center
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBadge;



