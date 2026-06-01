import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { formatDate } from "@/lib/dateUtils";
import api from "@/services/api";
import ProposalForm from "./ProposalForm";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import { useUser } from "@/context/UserContext";
import { 
  Button, 
  PageTransition, 
  Card, 
  Badge, 
  Separator, 
  Loader,
  Skeleton,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import { ArrowLeft, Calendar, CurrencyDollar, Briefcase, Tag, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";

const getCategoryLabel = (category) => {
  if (!category) return "Other";
  
  return category
  .split("-")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ");
};

const VendorTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [myProposal, setMyProposal] = useState(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { isApproved } = useApprovalStatus();

  const fetchTaskDetails = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data);
    } catch (error) {
      console.error("Task fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkMyProposal = useCallback(async () => {
    try {
      const { data: proposals } = await api.get(`/proposals/task/${id}`);
      const userId = user?.id || user?._id;
      const myProp = proposals.find((p) => (p.vendorId?._id || p.vendorId) === userId);
      setMyProposal(myProp || null);
    } catch (error) {
      console.error("Proposal check error:", error);
    }
  }, [id, user]);

  useEffect(() => {
    fetchTaskDetails();
    checkMyProposal();
  }, [fetchTaskDetails, checkMyProposal]);

  const handleProposalSubmitted = () => {
    setShowProposalForm(false);
    checkMyProposal();
    fetchTaskDetails();
  };

  if (loading) {
    return (
        <PageTransition>
            <div className="space-y-8 pt-4">
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </PageTransition>
    );
  }

  if (!task) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl mt-10">
          <Card className="p-8 border-danger/20 bg-danger-surface/30 shadow-none text-center">
            <WarningCircle className="mx-auto h-10 w-10 text-danger mb-4 opacity-50" />
            <p className="text-sm font-bold text-danger uppercase tracking-tight">Task not found or access denied.</p>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mt-4 font-bold uppercase tracking-tight">Return to Marketplace</Button>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-8 pb-12">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/vendor">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/vendor/available-tasks">Marketplace</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{task?.title || "Task Detail"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid-cols-1 grid gap-4">
            <Button variant="secondary" size="xs" onClick={() => navigate(-1)} className="w-full font-bold uppercase tracking-tight">
                
                Back to Tasks
            </Button></div>
        
        <Card className="overflow-hidden shadow-soft border-border/50">
          <div className="bg-muted/20 p-6 sm:p-8 border-b border-border/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 flex-1">
                <div className="flex flex-wrap gap-2">
                    <Badge variant={task.status === "open" ? "success" : task.status === "in-progress" ? "info" : "secondary"} className="font-bold uppercase tracking-widest px-3 py-1">
                    {task.status}
                    </Badge>
                    <Badge variant="outline" className="font-bold uppercase tracking-widest px-3 py-1 border-border/50 text-muted-foreground bg-card">
                        <Tag className="mr-1.5 h-3.5 w-3.5" />
                        {getCategoryLabel(task.category)}
                    </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-foreground uppercase leading-tight">
                    {task.title}
                </h1>
                <p className="text-[15px] text-foreground/70 font-medium leading-relaxed max-w-3xl">
                    {task.description}
                </p>
                </div>

                {task.status === "open" && !myProposal && (
                <Button
                    size="lg"
                    onClick={() => setShowProposalForm(true)}
                    disabled={!isApproved}
                    className="font-bold uppercase tracking-tight shadow-md h-14 px-8 shrink-0"
                    title={!isApproved ? "Wait for admin approval to submit proposals" : ""}
                >
                    Submit Proposal
                </Button>
                )}
            </div>
          </div>

          <Card.Content className="p-6 sm:p-8 space-y-10">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                { label: "Company", value: task.companyId?.companyName || "N/A", icon: <Briefcase className="text-foreground" /> },
                { label: "Budget", value: `$${task.budget?.toLocaleString()}`, icon: <CurrencyDollar className="text-jade-600" /> },
                { label: "Deadline", value: formatDate(task.deadline), icon: <Clock className="text-warning" /> },
                { label: "Posted On", value: formatDate(task.createdAt), icon: <Calendar className="text-sky-600" /> },
                ].map((item, index) => (
                <div key={index} className="flex flex-col gap-3 p-5 rounded-xl bg-muted/20 border border-border/30 transition-all hover:bg-muted/30">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border/50 shadow-xs">
                        {React.cloneElement(item.icon, { size: 16, strokeWidth: 2.5 })}
                    </div>
                    <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60 block mb-0.5">{item.label}</span>
                        <span className="text-sm font-bold text-foreground truncate block">{item.value}</span>
                    </div>
                </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-8 rounded-full bg-foreground" />
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-foreground">Detailed Requirements</h2>
                </div>
                <div className="p-6 rounded-xl bg-muted/20 border border-border/30 text-[14px] font-medium leading-relaxed whitespace-pre-wrap text-foreground/80 shadow-inner">
                {task.requirements || "No specific requirements provided."}
                </div>
            </div>
          </Card.Content>
        </Card>

        {myProposal && (
          <Card className={`overflow-hidden shadow-soft border-border/50 border-l-4 ${myProposal.status === "accepted" ? "border-l-jade-600" : "border-l-warning"}`}>
            <Card.Header className="bg-muted/20 px-6 py-5 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-sm font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-foreground" />
                    My Proposal Status
                </h2>
                <Badge variant={myProposal.status === "accepted" ? "success" : myProposal.status === "rejected" ? "error" : "warning"} className="font-bold uppercase tracking-widest px-4 py-1.5 shadow-sm">
                    {myProposal.status}
                </Badge>
                </div>
            </Card.Header>
            
            <Card.Content className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-xl bg-muted/20 border border-border/20 shadow-xs">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-1.5">Your Bid Price</p>
                    <p className="text-2xl font-extrabold text-foreground uppercase tracking-tighter">${myProposal.bidAmount?.toLocaleString()}</p>
                </div>
                <div className="p-5 rounded-xl bg-muted/20 border border-border/20 shadow-xs">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 mb-1.5">Proposed Deadline</p>
                    <p className="text-2xl font-extrabold text-foreground uppercase tracking-tighter">{formatDate(myProposal.proposedDeadline)}</p>
                </div>
                </div>

                <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Proposal Statement</p>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 bg-card p-5 rounded-xl border border-border/50 shadow-inner italic">
                    "{myProposal.proposalText}"
                </div>
                </div>

                {myProposal.status === "accepted" && (
                <div className="mt-8 p-5 rounded-xl bg-jade-400/10 border border-jade-600/20 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jade-600/20 text-jade-600">
                        <CheckCircle size={20} strokeWidth={3} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-jade-700 leading-tight">Congratulations! Your proposal has been accepted.</p>
                        <p className="text-[11px] font-medium text-jade-600/70 mt-1 uppercase tracking-tight">Active since {formatDate(myProposal.acceptedAt)}</p>
                    </div>
                </div>
                )}
            </Card.Content>
          </Card>
        )}

        {task.status !== "open" && !myProposal && (
          <div className="p-5 rounded-xl bg-warning/10 border border-warning/20 text-xs font-bold text-warning text-center uppercase tracking-widest shadow-sm">
            This task is currently <span className="underline decoration-warning/30">{task.status}</span> and is not accepting new proposals.
          </div>
        )}

        <ProposalForm
          taskId={id}
          companyId={task.companyId?._id || task.companyId}
          open={showProposalForm}
          onX={() => setShowProposalForm(false)}
          onProposalSubmitted={handleProposalSubmitted}
        />
      </div>
    </PageTransition>
  );
};

export default VendorTaskDetail;





