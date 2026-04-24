import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { ChartBar, ArrowRight } from "@phosphor-icons/react";
import {
  Card,
  EmptyState,
  Loader,
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/ui";

const VendorProgress = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <Loader />;
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ChartBar}
            title="No active tasks"
            description="Progress tracking will appear when you have active contracts"
          />
        ) : (
          <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <StaggerItem key={task.taskId}>
                <Card
                  onClick={() => navigate(`/vendor/task/${task.taskId}/progress`)}
                  className="p-4 cursor-pointer transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{task.taskTitle}</h3>
                      <p className="text-xs text-muted-foreground">{task.companyName} &middot; {task.category}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/70" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground/80">{task.progress}%</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Status: {task.currentStatus}</span>
                    <span>Budget: PKR {(task.budget || 0).toLocaleString()}</span>
                    {task.deadline && <span>Due: {formatDate(task.deadline)}</span>}
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>
    </PageTransition>
  );
};

export default VendorProgress;



