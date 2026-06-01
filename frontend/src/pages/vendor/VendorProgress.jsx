import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { ChartBar, ArrowRight, FileText, Calendar, CurrencyDollar, CheckCircle } from "@phosphor-icons/react";
import {
  Card,
  EmptyState,
  Skeleton,
  PageTransition,
  StaggerList,
  StaggerItem,
  Badge,
  Progress,
  StatCard
} from "@/components/ui";

const VendorProgress = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    if (!tasks.length) return null;
    return {
      total: tasks.length,
      avgProgress: Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length),
      pendingCompletion: tasks.filter(t => t.currentStatus === "pending-completion" || t.progress === 100).length,
      upcomingDeadlines: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
    };
  }, [tasks]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await progressAPI.getVendorActiveTasks();
        setTasks(res.data?.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageTransition>
      <div className="space-y-10">
        {loading ? (
            <div className="space-y-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Active Projects" value={stats.total} icon={<FileText />} />
                <StatCard title="Avg Momentum" value={`${stats.avgProgress}%`} icon={<ChartBar />} />
                <StatCard title="For Review" value={stats.pendingCompletion} icon={<CheckCircle />} />
                <StatCard title="Critical Path" value={stats.upcomingDeadlines} icon={<Calendar />} />
              </div>
            )}

            {tasks.length === 0 ? (
              <EmptyState
                icon={ChartBar}
                title="No active tasks"
                description="Progress tracking will appear when you have active contracts"
                className="py-16"
              />
            ) : (
              <StaggerList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <StaggerItem key={task.taskId}>
                    <Card
                      onClick={() => navigate(`/vendor/task/${task.taskId}/progress`)}
                      className="group cursor-pointer border-border/50 hover:border-ring/20 shadow-soft transition-all hover:-translate-y-1"
                    >
                        <Card.Header className="pb-3 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between py-3 px-5">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-card shadow-xs">
                                {task.category}
                            </Badge>
                            <div className="h-7 w-7 rounded-full bg-card border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-3.5 h-3.5 text-foreground" />
                            </div>
                        </Card.Header>
                        <Card.Content className="p-5">
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-tight line-clamp-1">{task.taskTitle}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Partner: {task.companyName}</p>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/50">Completion</span>
                                    <span className="text-[11px] font-bold text-foreground">{task.progress}%</span>
                                </div>
                                <Progress value={task.progress} className="h-1.5" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center">
                                        <CurrencyDollar className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40 leading-none">Budget</p>
                                        <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">${(task.budget || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40 leading-none">Deadline</p>
                                        <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">{task.deadline ? formatDate(task.deadline) : "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </Card.Content>
                        <Card.Footer className="px-5 py-3 bg-muted/10 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Status</span>
                            <Badge variant={task.currentStatus === "completed" ? "success" : "secondary"} className="text-[9px] px-1.5 py-0">
                                {task.currentStatus}
                            </Badge>
                        </Card.Footer>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default VendorProgress;

