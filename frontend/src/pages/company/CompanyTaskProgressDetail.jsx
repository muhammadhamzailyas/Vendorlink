import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { ArrowLeft, ChartBar, Clock, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Button, EmptyState, PageTransition, Skeleton, Loader } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import { DetailMetaGrid, DetailMetaItem, DetailSection } from "@/components/shared/DetailLayout";

const CompanyTaskProgressDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await progressAPI.getCompanyTaskProgress(taskId);
        setData(res.data?.data || null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  if (loading) {
    return (
      <PageTransition>
      <div className="space-y-8">
        <Loader />
      </div>
      </PageTransition>
    );
  }

  if (!data) {
    return (
      <PageTransition>
      <div className="space-y-8">
        <EmptyState
          icon={ChartBar}
          title="Progress data not found"
          description="This task may not have progress tracking data yet."
          action={<Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>}
        />
      </div>
      </PageTransition>
    );
  }

  const { task, updates, stats } = data;

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Progress</h1>
          <p className="text-muted-foreground">Review historical updates, current delivery state, and completion trajectory.</p>
        </div>
        <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <DetailSection title={task?.title || "Task"} description={task?.description || "Task progress detail summary."}>
        <DetailMetaGrid>
          <DetailMetaItem label="Vendor" value={task?.vendorName || "N/A"} />
          <DetailMetaItem label="Budget" value={`PKR ${(task?.budget || 0).toLocaleString()}`} />
          <DetailMetaItem label="Deadline" value={task?.deadline ? formatDate(task.deadline) : "N/A"} />
          <DetailMetaItem label="Current Status" value={<StatusChip status={stats?.currentStatus?.replace("_", "-") || "in-progress"} />} />
        </DetailMetaGrid>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground font-medium">Overall Progress</span>
            <span className="font-semibold">{stats?.currentProgress || 0}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${stats?.currentProgress || 0}%` }} />
          </div>
        </div>

        <DetailMetaGrid className="lg:grid-cols-3">
          <DetailMetaItem label="Total Updates" value={String(stats?.totalUpdates || 0)} />
          <DetailMetaItem label="Current Progress" value={`${stats?.currentProgress || 0}%`} />
          <DetailMetaItem label="Last Updated" value={stats?.lastUpdateDate ? formatDate(stats.lastUpdateDate) : "N/A"} />
        </DetailMetaGrid>
      </DetailSection>

      <DetailSection title="Progress History" description="Chronological progress updates from the assigned vendor.">
        {(!updates || updates.length === 0) ? (
          <EmptyState
            icon={ChartBar}
            title="No updates yet"
            description="Progress updates will appear as vendors report milestones and status changes."
            className="border-0 bg-transparent py-8 shadow-none"
          />
        ) : (
          <div className="space-y-3">
            {updates.map((u, i) => (
              <div key={u._id || i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.status === "completed" ? "bg-foreground text-white" : u.status === "delayed" ? "bg-danger-surface text-danger" : "bg-muted text-muted-foreground"}`}>
                    {u.status === "completed" ? <CheckCircle className="w-4 h-4" /> : u.status === "delayed" ? <WarningCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  {i < updates.length - 1 ? <div className="w-px flex-1 bg-border my-1" /> : null}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusChip status={u.status?.replace("_", "-")} />
                    <span className="text-xs text-muted-foreground/70">{formatDate(u.updateDate || u.createdAt)}</span>
                  </div>
                  {u.comment ? <p className="mt-1 text-sm text-muted-foreground">{u.comment}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailSection>
    </div>
    </PageTransition>
  );
};

export default CompanyTaskProgressDetail;



