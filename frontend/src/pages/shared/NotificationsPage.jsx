import React, { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { getRelativeTime } from "@/lib/dateUtils";
import {
  Bell, Check, Checks, Trash, CircleNotch,
} from "@phosphor-icons/react";
import { PageTransition, Button, Card, EmptyState, Tabs, TabsList, TabsTrigger, Separator } from "@/components/ui";

const NotificationsPage = () => {
  const {
    notifications, unreadCount, loading, markAsRead, markAllAsRead,
    deleteNotification, deleteReadNotifications, loadMore, pagination,
    refreshNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "border-l-danger";
      case "medium": return "border-l-warning";
      default: return "border-l-border";
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.read;
  });

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">Notifications</h2>
            <p className="text-sm text-muted-foreground">Track system events, status updates, and activity alerts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-warning">
                {unreadCount} unread
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="secondary"
                size="xs"
                className="font-bold uppercase tracking-tight"
              >
                <Checks className="w-3.5 h-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
            <Button
              onClick={deleteReadNotifications}
              variant="secondary"
              size="xs"
              className="font-bold uppercase tracking-tight"
            >
              <Trash className="w-3.5 h-3.5 mr-1.5" />
              Clear read
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap justify-start gap-1 w-fit mb-6">
                <TabsTrigger 
                    value="all"
                    className="rounded-lg px-4 py-2 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-foreground transition-all"
                >
                    All
                </TabsTrigger>
                <TabsTrigger 
                    value="unread"
                    className="rounded-lg px-4 py-2 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-foreground transition-all"
                >
                    Unread
                </TabsTrigger>
                <TabsTrigger 
                    value="read"
                    className="rounded-lg px-4 py-2 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-foreground transition-all"
                >
                    Read
                </TabsTrigger>
            </TabsList>

            {loading && notifications.length === 0 ? (
                <Card>
                    <div className="flex justify-center py-12">
                    <CircleNotch className="w-6 h-6 animate-spin text-muted-foreground/70" />
                    </div>
                </Card>
            ) : filteredNotifications.length === 0 ? (
            <EmptyState
                icon={Bell}
                title="No notifications"
                description={activeTab === "unread" ? "You have no unread notifications." : "You are all caught up."}
            />
            ) : (
            <Card className="overflow-hidden shadow-soft border-border/50">
                <Card.Header className="pb-3 border-b border-border/50">
                    <Card.Title className="text-sm font-bold uppercase tracking-tight">Notification Feed</Card.Title>
                    <Card.Description className="text-xs">Latest updates from tasks, contracts, and account activity.</Card.Description>
                </Card.Header>
                <Card.Content className="p-4 space-y-3">
                    {filteredNotifications.map((notif) => (
                        <div
                        key={notif._id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${getPriorityColor(notif.priority)} ${
                            notif.read ? "bg-card/50" : "bg-muted/30"
                        } border border-border/50 transition-colors hover:shadow-sm`}
                        >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                            <p className={`text-sm ${notif.read ? "text-foreground/80 font-medium" : "font-extrabold text-foreground"}`}>
                                {notif.title}
                            </p>
                            {!notif.read && <div className="w-2 h-2 rounded-full bg-foreground shrink-0" />}
                            </div>
                            <p className="text-sm text-muted-foreground font-medium mt-0.5">{notif.message}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-2.5">
                            {notif.createdAt ? getRelativeTime(notif.createdAt) : ""}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {!notif.read && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => markAsRead(notif._id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Mark as read"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            )}
                            <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => deleteNotification(notif._id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-danger hover:bg-danger-surface"
                            title="Delete"
                            >
                            <Trash className="w-4 h-4" />
                            </Button>
                        </div>
                        </div>
                    ))}

                    {pagination.page < pagination.totalPages && activeTab === "all" && (
                        <div className="text-center pt-4">
                        <Button
                            onClick={loadMore}
                            disabled={loading}
                            variant="secondary"
                            size="sm"
                            className="font-bold uppercase tracking-tight"
                        >
                            {loading ? "Loading..." : "Load more"}
                        </Button>
                        </div>
                    )}
                </Card.Content>
            </Card>
            )}
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default NotificationsPage;



