import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { 
  ChartBar, 
  ArrowRight, 
  Users, 
  CheckCircle, 
  WarningCircle, 
  Calendar, 
  CurrencyDollar 
} from "@phosphor-icons/react";
import { 
  Card, 
  EmptyState, 
  PageTransition, 
  StatCard, 
  Skeleton, 
  Badge, 
  Progress,
  StaggerList,
  StaggerItem
} from "@/components/ui";

const CompanyProgress = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await progressAPI.getCompanyActiveTasks();
        setTasks(res.data?.data || []);
        setStats(res.data?.stats || null);
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
                  {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
              </div>
          </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard title="Active Projects" value={stats.total} icon={<Users />} />
              <StatCard title="In Execution" value={stats.inProgress} icon={<ChartBar />} />
              <StatCard title="Review Status" value={stats.review} icon={<CheckCircle />} />
              <StatCard title="Avg Momentum" value={`${stats.averageProgress}%`} icon={<WarningCircle />} />
            </div>
          )}

          {tasks.length === 0 ? (
            <EmptyState
              icon={ChartBar}
              title="No active projects"
              description="Progress tracking will appear here once contracts become active."
              className="py-16"
            />
          ) : (
            <StaggerList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <StaggerItem key={task.taskId}>
                    <Card
                      onClick={() => navigate(`/company/task/${task.taskId}/progress`)}
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
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Vendor: {task.vendorName}</p>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/50">Execution Progress</span>
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
                                        <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40 leading-none">Allocated</p>
                                        <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">${(task.budget || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40 leading-none">Due Date</p>
                                        <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">{task.deadline ? formatDate(task.deadline) : "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </Card.Content>
                        <Card.Footer className="px-5 py-3 bg-muted/10 border-t border-border/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{task.updatesCount || 0} Ledger Entries</span>
                                {task.contractStatus === "pending-completion" && (
                                    <span className="text-[8px] font-bold text-warning uppercase mt-0.5 animate-pulse">Needs Review</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {task.contractStatus === "pending-completion" ? (
                                    <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                                        Reviewing
                                    </Badge>
                                ) : (
                                    <Badge variant={task.currentStatus === "completed" ? "success" : "secondary"} className="text-[9px] px-1.5 py-0">
                                        {task.currentStatus}
                                    </Badge>
                                )}
                            </div>
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

export default CompanyProgress;

