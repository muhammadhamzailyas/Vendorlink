import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { ChartBar, ArrowRight, Users, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Card, EmptyState, PageTransition, Skeleton, StatCard, Loader } from "@/components/ui";

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

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <Loader />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Active" value={stats.total} icon={<Users className="w-5 h-5" />} />
          <StatCard title="In Progress" value={stats.inProgress} icon={<ChartBar className="w-5 h-5" />} />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard title="Avg Progress" value={`${stats.averageProgress}%`} icon={<WarningCircle className="w-5 h-5" />} />
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={ChartBar}
          title="No active projects"
          description="Progress tracking will appear here once contracts become active."
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card
              key={task.taskId}
              onClick={() => navigate(`/company/task/${task.taskId}/progress`)}
              className="cursor-pointer p-4 transition-colors hover:bg-[var(--muted)]"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{task.taskTitle}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Vendor: {task.vendorName} &middot; {task.updatesCount || 0} updates</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)]/70" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--foreground)] transition-all" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]/80">{task.progress}%</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span>Status: {task.currentStatus}</span>
                <span>Budget: PKR {(task.budget || 0).toLocaleString()}</span>
                {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
};

export default CompanyProgress;
