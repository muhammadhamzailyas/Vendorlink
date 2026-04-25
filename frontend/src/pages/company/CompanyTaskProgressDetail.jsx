import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { showToast } from "@/lib/toast";
import { 
  CircleNotch, 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  ChartBar,
  SealCheck
} from "@phosphor-icons/react";
import { 
  Button, 
  PageTransition, 
  Card, 
  Progress,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import { DetailMetaGrid, DetailMetaItem, DetailSection } from "@/components/shared/DetailLayout";

const CompanyTaskProgressDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const loadProgress = async () => {
    try {
      const res = await progressAPI.getTaskProgress(taskId, true);
      setData(res.data?.data || res.data);
    } catch {
      showToast("Failed to load progress", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [taskId]);

  const handleApproveCompletion = async () => {
    if (!window.confirm("Are you sure you want to approve this project as completed? This will release the final payment from your wallet.")) return;
    
    setApproving(true);
    try {
      const res = await progressAPI.approveCompletion(taskId);
      showToast(res.data?.message || "Project completion approved!", "success");
      loadProgress();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to approve completion", "error");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-12">
          <CircleNotch className="h-6 w-6 animate-spin text-muted-foreground/70" />
        </div>
      </PageTransition>
    );
  }

  if (!data) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-12">
          <WarningCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-tight">Progress data not found</h2>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4 uppercase font-bold tracking-tight">
            Go Back
          </Button>
        </div>
      </PageTransition>
    );
  }

  const { task, contract, vendor, progressUpdates, stats } = data;
  const isPendingCompletion = contract?.status === "pending-completion";
  const isCompleted = contract?.status === "completed";

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/company/progress" className="uppercase font-bold tracking-widest text-[10px]">Progress</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="uppercase font-bold tracking-widest text-[10px]">{task?.title || "Details"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/50">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">{task?.title || "Task Progress"}</h1>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Project Ledger & Delivery Verification
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPendingCompletion && (
              <Button 
                onClick={handleApproveCompletion} 
                variant="primary"
                size="xs"
                className="font-bold uppercase tracking-tight shadow-soft"
                loading={approving}
              >
                <SealCheck className="w-4 h-4 mr-1.5" /> Approve Completion
              </Button>
            )}
          </div>
        </div>

        {isPendingCompletion && (
          <Card className="bg-warning/5 border-warning/20 shadow-none">
            <Card.Content className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Awaiting Your Approval</p>
                <p className="text-xs text-muted-foreground">The vendor has marked this project as completed. Review the updates below and approve to release final payment.</p>
              </div>
            </Card.Content>
          </Card>
        )}

        {isCompleted && (
          <Card className="bg-jade-500/5 border-jade-500/20 shadow-none">
            <Card.Content className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-jade-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-jade-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Project Finalized</p>
                <p className="text-xs text-muted-foreground">This project has been successfully completed and all payments have been processed.</p>
              </div>
            </Card.Content>
          </Card>
        )}

        <DetailSection title="Progress Overview" description="Current completion and execution status for this task.">
          <DetailMetaGrid className="lg:grid-cols-4">
            <DetailMetaItem label="Vendor" value={vendor?.username || "N/A"} />
            <DetailMetaItem label="Current Progress" value={`${stats?.lastUpdate?.percentage || 0}%`} />
            <DetailMetaItem label="Current Status" value={<StatusChip status={contract?.status || "active"} />} />
            <DetailMetaItem label="Budget" value={`$${(contract?.totalBudget || 0).toLocaleString()}`} />
          </DetailMetaGrid>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/60">Execution Roadmap</span>
              <span className="text-xs font-bold text-foreground">{stats?.lastUpdate?.percentage || 0}% Completed</span>
            </div>
            <Progress value={stats?.lastUpdate?.percentage || 0} className="h-2.5" />
          </div>
        </DetailSection>

        <DetailSection title="Progress History" description="Timeline of submitted progress entries from the vendor.">
          {(!progressUpdates || progressUpdates.length === 0) ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border/50 bg-muted/20">
              <ChartBar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/60">No progress entries reported yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {progressUpdates.map((update) => (
                <Card key={update._id} className="shadow-soft border-border/50 hover:border-ring/20 transition-all">
                  <Card.Header className="pb-3 border-b border-border/50 flex flex-row items-center justify-between py-3.5 px-5 bg-muted/20">
                    <StatusChip status={update.status || "in-progress"} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{update.updateDate ? formatDate(update.updateDate) : ""}</span>
                  </Card.Header>
                  <Card.Content className="p-5">
                    <p className="text-[13px] font-medium leading-relaxed text-foreground/80 mb-6 min-h-12">{update.comment}</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/50">Completion</span>
                            <span className="text-[11px] font-bold text-foreground">{update.percentage}%</span>
                        </div>
                        <Progress value={update.percentage} className="h-1.5" />
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </DetailSection>
      </div>
    </PageTransition>
  );
};

export default CompanyTaskProgressDetail;
