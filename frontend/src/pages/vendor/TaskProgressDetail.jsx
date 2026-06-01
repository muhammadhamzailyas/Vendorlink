import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { showToast } from "@/lib/toast";
import { 
  CircleNotch, 
  Plus, 
  ChartBar, 
  CheckCircle, 
  SealCheck,
  X
} from "@phosphor-icons/react";
import { 
  Button, 
  PageTransition, 
  Input, 
  Label, 
  Select, 
  Textarea, 
  Card, 
  Slider, 
  Progress,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import { DetailMetaGrid, DetailMetaItem, DetailSection } from "@/components/shared/DetailLayout";

const TaskProgressDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [form, setForm] = useState({
    updateDate: new Date().toISOString().split("T")[0],
    comment: "",
    status: "in-progress",
    percentage: 0,
  });

  const loadProgress = async () => {
    try {
      const res = await progressAPI.getTaskProgress(taskId);
      const resData = res.data?.data || res.data;
      setData(resData);
      if (resData?.currentProgress) {
        setForm(prev => ({ ...prev, percentage: resData.currentProgress }));
      }
      if (resData?.contract?.status === "completed") {
        progressAPI.getPaymentSummary(taskId).then(res => setPaymentSummary(res.data?.data));
      }
    } catch {
      showToast("Failed to load progress", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await progressAPI.addProgressUpdate(taskId, form);
      showToast("Progress updated!", "success");
      setShowForm(false);
      loadProgress();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteProject = async () => {
    if (!window.confirm("Are you sure you want to mark this project as completed? This will notify the company for final review and payment.")) return;
    
    setCompleting(true);
    try {
      await progressAPI.requestCompletion(taskId);
      showToast("Project completion requested!", "success");
      loadProgress();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit request", "error");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="flex justify-between items-center pb-4 border-b border-border/50">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl mt-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </PageTransition>
    );
  }

  const statusOptions = [
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
    { value: "review", label: "Review" },
    { value: "on-hold", label: "On Hold" },
  ];

  const contractStatus = data?.contract?.status;
  const isPendingCompletion = contractStatus === "pending-completion";
  const isCompleted = contractStatus === "completed";
  const canUpdate = contractStatus === "active";

  return (
    <PageTransition>
      <div className="space-y-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/vendor/progress" className="uppercase font-bold tracking-widest text-[10px]">Progress</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="uppercase font-bold tracking-widest text-[10px]">{data?.task?.title || "Details"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/50">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">{data?.task?.title || "Task Progress"}</h1>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Active Project Ledger & Milestone Reporting
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canUpdate && (
              <>
                <Button 
                    onClick={() => setShowForm(!showForm)} 
                    variant={showForm ? "secondary" : "primary"}
                    size="xs"
                    className="font-bold uppercase tracking-tight"
                >
                  {showForm ? <> Close</> : <> Add Update</>}
                </Button>
                <Button 
                    onClick={handleCompleteProject} 
                    variant="success"
                    size="xs"
                    className="font-semibold uppercase tracking-tight shadow-soft"
                    loading={completing}
                >
                   Project Completed
                </Button>
              </>
            )}
          </div>
        </div>

        {isPendingCompletion && (
          <Card className="bg-warning/5 border-warning/20 shadow-none">
            <Card.Content className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <CircleNotch className="h-5 w-5 text-warning animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Completion Under Review</p>
                <p className="text-xs text-muted-foreground">You've marked this project as completed. Waiting for company approval and final payment release.</p>
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
                <p className="text-sm font-bold text-foreground">Project Completed</p>
                <p className="text-xs text-muted-foreground">This project has been finalized and payment has been processed to your wallet.</p>
              </div>
            </Card.Content>
          </Card>
        )}

        <DetailSection title="Progress Overview" description="Current completion and execution status for this task.">
          <DetailMetaGrid className="lg:grid-cols-3">
            <DetailMetaItem label="Current Progress" value={`${data?.currentProgress || 0}%`} />
            <DetailMetaItem label="Contract Status" value={<StatusChip status={contractStatus || "active"} />} />
            <DetailMetaItem label="Total Updates" value={String(data?.progressUpdates?.length || 0)} />
          </DetailMetaGrid>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/60">Execution Roadmap</span>
              <span className="text-xs font-bold text-foreground">{data?.currentProgress || 0}% Completed</span>
            </div>
            <Progress value={data?.currentProgress || 0} className="h-2.5" />
          </div>
        </DetailSection>

        {isCompleted && paymentSummary && (
            <DetailSection title="Final Payment Summary" description="Details of the finalized payment for this project.">
                <Card className="bg-jade-500/5 border-jade-500/20 shadow-none p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailMetaItem label="Amount Received" value={`$${paymentSummary.vendorAmount.toFixed(2)}`} />
                        <DetailMetaItem label="Platform Fee" value={`$${paymentSummary.platformFee.toFixed(2)}`} />
                        <DetailMetaItem label="Invoice" value={paymentSummary.invoiceNumber || "N/A"} />
                        <DetailMetaItem label="Date Credited" value={formatDate(paymentSummary.paymentDate)} />
                    </div>
                </Card>
            </DetailSection>
        )}

        {showForm && (
          <DetailSection title="Add Progress Update" description="Submit a new progress checkpoint for this task.">
            <Card className="bg-muted/10 border-border/50 shadow-none">
                <Card.Content className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Input
                        label="Date"
                        type="date"
                        value={form.updateDate}
                        onChange={(e) => setForm({ ...form, updateDate: e.target.value })}
                        required
                        />
                        <Select
                        label="Work Status"
                        value={form.status}
                        onChange={(val) => setForm({ ...form, status: val })}
                        options={statusOptions}
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground/80">Progress Completion</Label>
                            <span className="text-sm font-bold text-foreground">{form.percentage}%</span>
                        </div>
                        <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[form.percentage]}
                        onValueChange={(value) => setForm({ ...form, percentage: value[0] ?? 0 })}
                        />
                    </div>
                    <Textarea
                        label="Work Log & Comments"
                        value={form.comment}
                        onChange={(e) => setForm({ ...form, comment: e.target.value })}
                        placeholder="What milestones did you hit or what challenges are you facing?"
                        rows={4}
                        className="resize-none"
                        required
                    />
                    <div className="grid-cols-2 grid grid-col-reverse gap-2 pt-2 sm:grid-row sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="w-full sm:w-auto font-bold uppercase tracking-tight">
                        Cancel
                        </Button>
                        <Button type="submit" loading={submitting} disabled={submitting} className="w-full sm:w-auto font-semibold uppercase tracking-tight shadow-soft">
                        Save Progress Entry
                        </Button></div>
                    </form>
                </Card.Content>
            </Card>
          </DetailSection>
        )}

        <DetailSection title="Update History" description="Timeline of submitted progress entries for company review.">
          {(!data?.progressUpdates || data.progressUpdates.length === 0) ? (
            <div className="py-12 text-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
              <ChartBar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-bold uppercase tracking-tight text-muted-foreground/60">No progress entries yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {data.progressUpdates.map((update) => (
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

export default TaskProgressDetail;

