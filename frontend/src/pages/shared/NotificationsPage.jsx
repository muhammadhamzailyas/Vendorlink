import React, { useEffect, useMemo, useState } from "react";
import { 
  Bell, 
  Checks, 
  Trash, 
  Clock, 
  ArrowRight
} from "@phosphor-icons/react";
import { useNotifications } from "../../context/NotificationContext";
import { formatDate } from "../../lib/dateUtils";
import { 
  Button, 
  Card, 
  EmptyState, 
  PageTransition, 
  Skeleton, 
  Badge
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import { cn } from "@/lib/cn";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const priorityConfig = {
  urgent: { dot: "bg-error", label: "Urgent", badge: "bg-error/10 text-error border-error/20" },
  high: { dot: "bg-warning", label: "High", badge: "bg-warning/10 text-warning border-warning/20" },
  medium: { dot: "bg-foreground", label: "Normal", badge: "bg-muted text-foreground border-border" },
  low: { dot: "bg-border", label: "Low", badge: "bg-muted/50 text-muted-foreground border-border/50" },
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotification,
    fetchNotifications
  } = useNotifications();

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  // Ensure we have a good set of notifications by refreshing on mount
  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const tabOptions = [
    { label: "All Activity", value: "all", count: notifications.length },
    { label: "Unread", value: "unread", count: unreadCount },
    { label: "Important", value: "high", count: notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length }
  ];

  const filtered = useMemo(() => {
    return notifications.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                            n.message.toLowerCase().includes(search.toLowerCase());
        
        const currentTab = tabOptions[activeTab].value;
        const matchesTab = currentTab === 'all' || 
                         (currentTab === 'unread' && !n.read) ||
                         (currentTab === 'high' && (n.priority === 'high' || n.priority === 'urgent'));
        
        return matchesSearch && matchesTab;
    });
  }, [notifications, search, activeTab]);

  const handleAction = (n) => {
    if (!n.read) markAsRead(n._id);
    const role = user?.role || "";
    
    if (n.data?.contractId) navigate(`/${role}/contract/${n.data.contractId}`);
    else if (n.data?.taskId) navigate(`/${role}/task/${n.data.taskId}`);
    else if (n.type === 'new_user' || n.type === 'new_user_registered') navigate(`/admin/pending`);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <FilterSearchBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search notifications..."
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
        />

        {loading && notifications.length === 0 ? (
          <Skeleton.Page rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Notification center is clear"
            description={search ? "Try adjusting your filters" : "You're all caught up! No new alerts at the moment."}
            className="border-none bg-transparent py-16 shadow-none"
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((n) => {
              const priority = priorityConfig[n.priority] || priorityConfig.medium;
              const isToday = dayjs(n.createdAt).isSame(dayjs(), 'day');
              
              return (
                <Card 
                    key={n._id} 
                    className={cn(
                        "group transition-all duration-300 border-border/40 hover:border-foreground/20",
                        !n.read ? "bg-muted/10 border-l-4 border-l-foreground" : "bg-card opacity-80"
                    )}
                >
                    <Card.Content className="p-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-6">
                            <div className="flex items-start gap-5 flex-1 min-w-0">
                                <div className={cn(
                                    "p-3 rounded-xl shrink-0 transition-colors",
                                    !n.read ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                                )}>
                                    <Bell size={24} weight={n.read ? "regular" : "fill"} />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className={cn(
                                            "text-sm font-bold uppercase tracking-tight",
                                            !n.read ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {n.title}
                                        </h3>
                                        {!isToday && (
                                            <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 bg-muted/50">
                                                Archive
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0", priority.badge)}>
                                            {priority.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter pt-1 flex items-center gap-2">
                                        <Clock size={12} weight="bold" />
                                        {formatDate(n.createdAt)} • {dayjs(n.createdAt).fromNow()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid-cols-2 grid gap-3 w-full sm:w-auto">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleAction(n)}
                                    className="w-full flex-1 sm:flex-none rounded-xl font-black uppercase tracking-tighter text-[10px] h-10 gap-2 border-border/50 hover:bg-foreground hover:text-background"
                                >
                                    Take Action 
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => deleteNotification(n._id)}
                                    className="w-full h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-error hover:bg-error/5"
                                >
                                    
                                </Button></div>
                        </div>
                    </Card.Content>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default NotificationsPage;

