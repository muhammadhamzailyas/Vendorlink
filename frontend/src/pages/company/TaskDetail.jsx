import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft as ArrowBack, ClipboardText, Info } from "@phosphor-icons/react";
import toastUtil from "@/lib/toast";
import { formatDate } from "@/lib/dateUtils";

import { proposalAPI, taskAPI } from "@/services/api";
import { 
  Button, 
  Card, 
  EmptyState, 
  PageTransition, 
  Skeleton, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent, 
  Badge, 
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import { DetailSection } from "@/components/shared/DetailLayout";

import DetailTask from "./DetailTask";
import DetailProposalCard from "./DetailProposalCard";
import RankProposalsButton from "./RankProposalsButton";

const CompanyTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankedIds, setRankedIds] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, proposalsRes] = await Promise.all([
        taskAPI.getById(id),
        proposalAPI.getTaskProposals(id),
      ]);

      setTask(taskRes.data || null);
      setProposals(proposalsRes.data || []);
    } catch (err) {
      console.error(err);
      toastUtil.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProposalAction = async (proposalId, action) => {
    const isAccept = action === "accept";

    const msg = isAccept
      ? "Are you sure you want to ACCEPT this proposal? All others will be rejected."
      : "Are you sure you want to REJECT this proposal?";

    const confirmed = await toastUtil.confirm(msg, {
      confirmLabel: isAccept ? "Accept" : "Reject",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    try {
      if (isAccept) {
        await proposalAPI.accept(proposalId);
      } else {
        await proposalAPI.reject(proposalId);
      }

      const verb = isAccept ? "accepted" : "rejected";
      toastUtil.success(`Proposal ${verb}`);
      fetchData();
    } catch (error) {
      toastUtil.error(
        error.response?.data?.error || `Failed to update proposal`
      );
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <Skeleton.Page rows={4} />
        </div>
      </PageTransition>
    );
  }

  if (!task) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <EmptyState
            title="Task not found"
            description="This task may no longer exist, or you may not have access to it."
            action={(
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                <ArrowBack className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          />
        </div>
      </PageTransition>
    );
  }

  const acceptedProposal = proposals.find((p) => p.status === "accepted");
  const pendingCount = proposals.filter(
    (p) => p.status === "submitted"
  ).length;

  const handleRankingComplete = (ranked) => {
    if (ranked && ranked.length > 0) {
      const idOrder = ranked.map((r) => r.odId || r.vendorId || r.proposalId);
      setRankedIds(idOrder);
    }
  };

  const displayedProposals = rankedIds
    ? [...proposals].sort((a, b) => {
        const aIdx = rankedIds.indexOf(a.vendor?._id || a.vendor);
        const bIdx = rankedIds.indexOf(b.vendor?._id || b.vendor);
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      })
    : proposals;

  return (
    <PageTransition>
      <div className="space-y-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/company">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/company/my-tasks">My Tasks</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{task?.title || "Task Detail"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">{task.title || "Task Detail"}</h2>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              <span>Created {formatDate(task.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="xs" onClick={() => navigate(-1)} className="font-bold uppercase tracking-tight">
              <ArrowBack className="mr-2 h-4 w-4" />
              Back
            </Button>
            <StatusChip status={task.status || "open"} />
          </div>
        </div>

        {task.selectedVendor && (
          <Card className="border-jade-600/20 bg-jade-400/10 shadow-none">
            <Card.Content className="flex items-center gap-3 p-4">
                <Badge variant="success" className="font-bold uppercase tracking-widest px-3 py-1">Assigned</Badge>
                <p className="text-sm font-bold text-jade-600">
                Task assigned to <span className="underline decoration-jade-600/30">{task.selectedVendor?.username || "Verified Vendor"}</span>
                </p>
            </Card.Content>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap justify-start gap-1 w-fit mb-8 shadow-inner border border-border/50">
                <TabsTrigger 
                    value="overview"
                    className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-foreground data-[state=active]:shadow-soft transition-all"
                >
                    <Info className="mr-2 h-3.5 w-3.5" />
                    Overview
                </TabsTrigger>
                <TabsTrigger 
                    value="proposals"
                    className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-foreground data-[state=active]:shadow-soft transition-all"
                >
                    <ClipboardText className="mr-2 h-3.5 w-3.5" />
                    Proposals
                    {proposals.length > 0 && (
                        <span className="ml-2 rounded-full bg-muted/20 px-1.5 py-0.5 text-[9px] font-extrabold">{proposals.length}</span>
                    )}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <DetailTask task={task} proposals={proposals} formatDate={formatDate} />
            </TabsContent>

            <TabsContent value="proposals" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="shadow-soft border-border/50">
                    <Card.Header className="pb-4 border-b border-border/50 bg-muted/20">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <Card.Title className="text-sm font-bold uppercase tracking-tight">Bid Registry</Card.Title>
                                <Card.Description className="text-xs">Review and compare vendor submissions for this task.</Card.Description>
                            </div>
                            <div className="flex items-center gap-3">
                                {proposals.length > 0 && (
                                <RankProposalsButton
                                    taskId={id}
                                    onRankingComplete={handleRankingComplete}
                                    disabled={proposals.length < 2}
                                />
                                )}
                                {pendingCount > 0 && (
                                    <Badge variant="warning" className="font-bold uppercase tracking-widest px-3 py-1">
                                        {pendingCount} Pending
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Content className="p-6">
                        {proposals.length === 0 ? (
                        <EmptyState
                            icon={ClipboardText}
                            title="No proposals received yet"
                            description="Waiting for vendors to submit proposals for your task posting."
                            className="border-0 bg-transparent py-12"
                        />
                        ) : (
                        <>
                            {rankedIds && (
                            <div className="mb-8 p-4 rounded-xl border border-ring/20 bg-muted/30 flex items-center gap-3">
                                <Badge className="bg-foreground/20 text-foreground border-none">AI SORTED</Badge>
                                <p className="text-xs font-bold text-foreground/80 uppercase tracking-tight">
                                    Proposals sorted by performance matching. Best matches are shown first.
                                </p>
                            </div>
                            )}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {displayedProposals.map((proposal, index) => (
                                <div key={proposal._id} className="relative group">
                                {rankedIds && (
                                    <div className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[10px] font-extrabold text-white shadow-lg border-2 border-paper ring-4 ring-background">
                                    #{index + 1}
                                    </div>
                                )}
                                <DetailProposalCard
                                    proposal={proposal}
                                    task={task}
                                    formatDate={formatDate}
                                    onAccept={() => handleProposalAction(proposal._id, "accept")}
                                    onReject={() => handleProposalAction(proposal._id, "reject")}
                                    acceptedProposal={acceptedProposal}
                                />
                                </div>
                            ))}
                            </div>
                        </>
                        )}
                    </Card.Content>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default CompanyTaskDetail;



