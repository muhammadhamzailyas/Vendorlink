import React, { useMemo, useState, useEffect } from "react";
import {
  ClipboardText as Assignment,
  CheckCircle,
  XCircle,
  Clock,
  Signature as Contract,
  CaretUp,
  CaretDown,
  Eye as Visibility,
  Briefcase,
  Calendar,
  DotsThreeVertical
} from "@phosphor-icons/react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { proposalAPI } from "@/services/api";
import { 
  Button, 
  EmptyState, 
  PageTransition, 
  DataTable, 
  Skeleton,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";
import { cn } from "@/lib/cn";
import toastUtil from "@/lib/toast";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import ProposalDetailsModal from "@/components/shared/ProposalDetailsModal";
import RankProposalsButton from "./RankProposalsButton";
import AIRankingExplanationModal from "./AIRankingExplanationModal";

dayjs.extend(relativeTime);

const FILTER_VALUES = ["all", "submitted", "accepted", "rejected"];

const CompanyProposals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get("taskId");
  
  const { isApproved } = useApprovalStatus();
  const [proposals, setProposals] = useState([]);
  const [filterTab, setFilterTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [rankedIds, setRankedIds] = useState(null);
  const [rankedData, setRankedData] = useState([]);

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [aiExplanationOpen, setAiExplanationOpen] = useState(false);
  
  // Decision Alert states
  const [decisionAlertOpen, setDecisionAlertOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadProposals();
  }, [taskIdParam]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      let res;
      if (taskIdParam) {
          res = await proposalAPI.getTaskProposals(taskIdParam);
      } else {
          res = await proposalAPI.getCompanyProposals();
      }
      setProposals(res.data || []);
      setRankedIds(null); // Reset ranking when data changes
      setRankedData([]);
    } finally {
      setLoading(false);
    }
  };

  const activeFilter = FILTER_VALUES[filterTab] || "all";

  const handleActionClick = (proposal, action) => {
    setSelectedProposal(proposal);
    setPendingAction(action);
    setDecisionAlertOpen(true);
  };

  const handleRankingComplete = (ranked) => {
    if (ranked && ranked.length > 0) {
      const idOrder = ranked.map((r) => r._id);
      setRankedIds(idOrder);
      setRankedData(ranked);
      setAiExplanationOpen(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedProposal || !pendingAction) return;
    
    setIsProcessing(true);
    try {
        if (pendingAction === "accept") {
            await proposalAPI.accept(selectedProposal._id);
            toastUtil.success("Proposal accepted successfully. Others for this task have been rejected.");
        } else {
            await proposalAPI.reject(selectedProposal._id);
            toastUtil.success("Proposal rejected");
        }
        await loadProposals();
        setDecisionAlertOpen(false);
        setDetailsModalOpen(false);
    } catch (error) {
        toastUtil.handleApiError(error);
    } finally {
        setIsProcessing(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = proposals.filter((proposal) => {
      const matchesFilter = activeFilter === "all" || proposal.status === activeFilter;
      const taskTitle = proposal.taskId?.title || proposal.task?.title || "";
      const vendorName = proposal.vendorId?.fullName || proposal.vendorId?.companyName || proposal.vendorId?.email || "";
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        taskTitle.toLowerCase().includes(query) ||
        vendorName.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });

    if (rankedIds) {
        result = [...result].sort((a, b) => {
            const aIdx = rankedIds.indexOf(a._id);
            const bIdx = rankedIds.indexOf(b._id);
            if (aIdx === -1 && bIdx === -1) return 0;
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
        });
    }

    return result;
  }, [proposals, activeFilter, searchTerm, rankedIds]);

  const stats = useMemo(() => ({
    total: proposals.length,
    submitted: proposals.filter((p) => p.status === "submitted").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  }), [proposals]);

  const proposalColumns = [
    {
      key: "task",
      label: "Project Assignment",
      render: (proposal) => {
        const taskTitle = proposal.taskId?.title || proposal.task?.title || "Untitled task";
        return (
            <div>
                <p className="text-sm font-semibold text-foreground line-clamp-1">{taskTitle}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                    Category: {proposal.taskId?.category?.replace(/-/g, ' ') || "General"}
                </p>
            </div>
        );
      },
    },
    {
      key: "vendor",
      label: "Expert Vendor",
      render: (proposal) => {
        const vendor = proposal.vendorId || {};
        const vendorName = vendor.companyName || vendor.fullName || vendor.email || "Vendor";
        return (
          <div className="flex items-center gap-3">
            <UserAvatar user={vendor} name={vendorName} size="xs" />
            <span className="text-sm font-medium text-foreground/80">{vendorName}</span>
          </div>
        );
      },
    },
    {
      key: "bid",
      label: "Bid Amount",
      render: (proposal) => (
          <span className="text-sm font-black text-foreground">
              ${(proposal.bidAmount || 0).toLocaleString()}
          </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (proposal) => <StatusChip status={proposal.status || "submitted"} />,
    },
    {
      key: "submitted",
      label: "Timeline",
      render: (proposal) => {
        const createdAt = proposal.submittedAt || proposal.createdAt;
        return (
          <>
            <p className="text-sm text-foreground">{dayjs(createdAt).format("MMM DD, YYYY")}</p>
            <p className="text-xs text-muted-foreground">{dayjs(createdAt).fromNow()}</p>
          </>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      cellClassName: "px-6 py-4 text-right",
      render: (proposal) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <DotsThreeVertical size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => {
              setSelectedProposal(proposal);
              setDetailsModalOpen(true);
            }}>
              <Visibility className="mr-2 h-4 w-4" />
              Review Proposal
            </DropdownMenuItem>
            
            {proposal.status === "submitted" && (
                <DropdownMenuItem 
                    onClick={() => handleActionClick(proposal, "accept")}
                    disabled={!isApproved}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Hire Vendor
                </DropdownMenuItem>
            )}

            {proposal.status === "accepted" && (
                <DropdownMenuItem onClick={() => navigate(`/company/contract/create?proposalId=${proposal._id}`)}>
                    <Contract className="mr-2 h-4 w-4" />
                    Create Contract
                </DropdownMenuItem>
            )}

            {proposal.status === "submitted" && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => handleActionClick(proposal, "reject")}
                        className="text-error focus:text-error"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Bid
                    </DropdownMenuItem>
                </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tabOptions = [
    { label: "All", count: stats.total },
    { label: "Pending", count: stats.submitted },
    { label: "Accepted", count: stats.accepted },
    { label: "Rejected", count: stats.rejected },
  ];

  const currentTaskTitle = proposals[0]?.taskId?.title || "Project";

  return (
    <PageTransition>
      <div className="space-y-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/company">Dashboard</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/company/my-tasks">My Tasks</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Proposal Registry</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-1 border-b border-border/40 pb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                {taskIdParam ? `Proposals for: ${currentTaskTitle}` : "Proposal Registry"}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
                {taskIdParam ? "Managing submissions for this specific task" : "Manage and evaluate incoming bids from expert vendors across all your postings."}
            </p>
        </div>

        {loading ? (
          <div className="space-y-3 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <FilterSearchBar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="search by task or vendor..."
              className="mb-0"
              showToggle={false}
              actions={taskIdParam && (
                  <RankProposalsButton 
                    taskId={taskIdParam} 
                    onRankingComplete={handleRankingComplete}
                    disabled={proposals.length < 2}
                  />
              )}
            />

            <div className="pt-6">
                <DataTable
                    columns={proposalColumns}
                    data={filteredAndSorted}
                    rowKey="_id"
                    showSectionHeader={false}
                    showTableHeader={true}
                    emptyState={(
                        <EmptyState
                        icon={Assignment}
                        title="No proposals found"
                        description={taskIdParam ? "No one has bid on this task yet." : "Incoming bids from vendors will appear here once your tasks attract interest."}
                        className="border-0 bg-transparent py-12"
                        />
                    )}
                />
            </div>
          </>
        )}

        <ProposalDetailsModal
            open={detailsModalOpen}
            proposal={selectedProposal}
            isApproved={isApproved}
            onX={() => setDetailsModalOpen(false)}
            onAccept={(p) => handleActionClick(p, "accept")}
            onReject={(p) => handleActionClick(p, "reject")}
        />

        <AIRankingExplanationModal
            open={aiExplanationOpen}
            onX={() => setAiExplanationOpen(false)}
            rankedData={rankedData}
        />

        <AlertDialog open={decisionAlertOpen} onOpenChange={setDecisionAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingAction === "accept" ? "Accept Expert Proposal?" : "Reject Proposal?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingAction === "accept"
                  ? "This will officially hire the vendor for this task. All other pending proposals for this task will be automatically rejected."
                  : "Are you sure you want to reject this bid? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {selectedProposal && (
                <div className="my-4 rounded-xl border border-border bg-muted/30 p-4 text-xs font-bold text-foreground/80 uppercase tracking-tight">
                    <p>Task: {selectedProposal?.taskId?.title || selectedProposal?.task?.title || "Untitled Task"}</p>
                    <p className="mt-1">Vendor: {selectedProposal?.vendorId?.companyName || selectedProposal?.vendorId?.fullName || selectedProposal?.vendorId?.email}</p>
                    <p className="mt-1 text-primary font-black">Bid: ${selectedProposal?.bidAmount?.toLocaleString()}</p>
                </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleConfirmAction}
                loading={isProcessing}
                variant={pendingAction === "accept" ? "default" : "destructive"}
                className="font-semibold uppercase tracking-tight text-[11px]"
              >
                {pendingAction === "accept" ? "Confirm Hire" : "Reject Bid"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default CompanyProposals;

