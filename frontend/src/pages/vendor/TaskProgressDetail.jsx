import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { progressAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { showToast } from "@/lib/toast";
import { ArrowLeft, CircleNotch, Plus, ChartBar } from "@phosphor-icons/react";
import { Button, PageTransition, Input, Label, Select, Textarea, Card, Slider, Progress } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import { DetailMetaGrid, DetailMetaItem, DetailSection } from "@/components/shared/DetailLayout";

const TaskProgressDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    updateDate: new Date().toISOString().split("T")[0],
    comment: "",
    status: "in-progress",
    percentage: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await progressAPI.getTaskProgress(taskId);
        setData(res.data?.data || res.data);
      } catch {
        showToast("Failed to load progress", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await progressAPI.addProgressUpdate(taskId, form);
      showToast("Progress updated!", "success");
      setShowForm(false);
      setForm({ updateDate: new Date().toISOString().split("T")[0], comment: "", status: "in-progress", percentage: form.percentage });
      // Reload
      const res = await progressAPI.getTaskProgress(taskId);
      setData(res.data?.data || res.data);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center py-12">
          <CircleNotch className="h-6 w-6 animate-spin text-[var(--muted-foreground)]/70" />
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

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase">{data?.task?.title || "Task Progress"}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Track delivery progression and submit milestone updates for company visibility.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => navigate(-1)}
              className="font-bold uppercase tracking-tight"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <Button 
                onClick={() => setShowForm(!showForm)} 
                variant={showForm ? "secondary" : "primary"}
                size="xs"
                className="font-bold uppercase tracking-tight"
            >
              {showForm ? <><ArrowLeft className="w-4 h-4 mr-1.5" /> Hide Form</> : <><Plus className="w-4 h-4 mr-1.5" /> Add Update</>}
            </Button>
          </div>
        </div>

        <DetailSection title="Progress Overview" description="Current completion and execution status for this task.">
          <DetailMetaGrid className="lg:grid-cols-3">
            <DetailMetaItem label="Current Progress" value={`${data?.currentProgress || 0}%`} />
            <DetailMetaItem label="Current Status" value={<StatusChip status={data?.currentStatus || "in-progress"} />} />
            <DetailMetaItem label="Total Updates" value={String(data?.progressUpdates?.length || 0)} />
          </DetailMetaGrid>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]/60">Execution Roadmap</span>
              <span className="text-xs font-bold text-[var(--foreground)]">{data?.currentProgress || 0}% Completed</span>
            </div>
            <Progress value={data?.currentProgress || 0} className="h-2.5" />
          </div>
        </DetailSection>

        {showForm && (
          <DetailSection title="Add Progress Update" description="Submit a new progress checkpoint for this task.">
            <Card className="bg-[var(--muted)]/10 border-[var(--border)]/50 shadow-none">
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
                            <Label className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]/80">Progress Completion</Label>
                            <span className="text-sm font-bold text-[var(--foreground)]">{form.percentage}%</span>
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
                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="w-full sm:w-auto font-bold uppercase tracking-tight">
                        Cancel
                        </Button>
                        <Button type="submit" loading={submitting} disabled={submitting} className="w-full sm:w-auto font-bold uppercase tracking-tight shadow-soft">
                        Save Progress Entry
                        </Button>
                    </div>
                    </form>
                </Card.Content>
            </Card>
          </DetailSection>
        )}

        <DetailSection title="Update History" description="Timeline of submitted progress entries for company review.">
          {(!data?.progressUpdates || data.progressUpdates.length === 0) ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-[var(--border)]/50 bg-[var(--muted)]/20">
              <ChartBar className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]/30" />
              <p className="text-sm font-bold uppercase tracking-tight text-[var(--muted-foreground)]/60">No progress entries yet</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {data.progressUpdates.map((update) => (
                <Card key={update._id} className="shadow-soft border-[var(--border)]/50 hover:border-[var(--ring)]/20 transition-all">
                  <Card.Header className="pb-3 border-b border-[var(--border)]/50 flex flex-row items-center justify-between py-3.5 px-5 bg-[var(--muted)]/20">
                    <StatusChip status={update.status || "in-progress"} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]/60">{update.updateDate ? formatDate(update.updateDate) : ""}</span>
                  </Card.Header>
                  <Card.Content className="p-5">
                    <p className="text-[13px] font-medium leading-relaxed text-[var(--foreground)]/80 mb-6 min-h-12">{update.comment}</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold uppercase tracking-tighter text-[var(--muted-foreground)]/50">Completion</span>
                            <span className="text-[11px] font-bold text-[var(--foreground)]">{update.percentage}%</span>
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
