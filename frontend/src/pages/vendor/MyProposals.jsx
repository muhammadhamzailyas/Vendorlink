import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardText as Assignment,
  CheckCircle as CheckCircle,
  Clock as PendingIcon,
  XCircle as Cancel,
  Eye as Visibility,
  Briefcase,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  CaretUp,
  CaretDown,
  TrendUp,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { proposalAPI } from "@/services/api";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";
import { 
  Button, 
  EmptyState, 
  PageTransition, 
  Skeleton, 
  StatCard, 
  DataTable,
  Combobox,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import toastUtil from "@/lib/toast";
import ProposalDetailsModal from "@/components/shared/ProposalDetailsModal";
import ProposalUpdateModal from "./ProposalUpdateModal";

dayjs.extend(relativeTime);

const MyProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updateModalOpen, setProposalUpdateOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Deletion states
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletabilityInfo, setDeletabilityInfo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyProposals();
  }, []);

  const fetchMyProposals = async () => {
    try {
      setLoading(true);
      const { data } = await proposalAPI.getVendorProposals();
      setProposals(data || []);
    } catch (error) {
      console.error("Proposals fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = async (proposal) => {
    try {
      setSelectedProposal(proposal);
      const res = await proposalAPI.checkDeletability(proposal._id);
      setDeletabilityInfo(res.data);
      setDeleteAlertOpen(true);
    } catch (error) {
      toastUtil.handleApiError(error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProposal || !deletabilityInfo?.canDelete) return;
    setIsDeleting(true);
    try {
      await proposalAPI.deleteProposal(selectedProposal._id);
      toastUtil.success("Proposal withdrawn successfully");
      setProposals(prev => prev.filter(p => p._id !== selectedProposal._id));
      setDeleteAlertOpen(false);
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => ({
    total: proposals.length,
    submitted: proposals.filter((p) => p.status === "submitted").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  }), [proposals]);

  // Advanced filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [bidFilter, setBidFilter] = useState("all");

  const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "submitted", label: "Under Review" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ];

  const BID_RANGES = [
    { value: "all", label: "Any Bid" },
    { value: "under-100", label: "Under $100" },
    { value: "100-500", label: "$100 - $500" },
    { value: "500-1000", label: "$500 - $1,000" },
    { value: "1000-plus", label: "$1,000+" },
  ];

  const filteredProposals = useMemo(() => proposals.filter((p) => {
    const matchesSearch =
      p.taskId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companyId?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    
    let matchesBid = true;
    if (bidFilter === "under-100") matchesBid = p.bidAmount < 100;
    else if (bidFilter === "100-500") matchesBid = p.bidAmount >= 100 && p.bidAmount <= 500;
    else if (bidFilter === "500-1000") matchesBid = p.bidAmount > 500 && p.bidAmount <= 1000;
    else if (bidFilter === "1000-plus") matchesBid = p.bidAmount > 1000;

    return matchesSearch && matchesStatus && matchesBid;
  }), [proposals, searchTerm, statusFilter, bidFilter]);

  const ChangeIndicator = ({ value }) => {
    const val = parseFloat(value || 0);
    const isPositive = val > 0;
    const isNegative = val < 0;
    const colorClass = isPositive ? "bg-success/20 text-success border-success/30" : isNegative ? "bg-error/20 text-error border-error/30" : "bg-muted text-muted-foreground border-border";

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border mt-1", colorClass)}>
            <div className="flex items-center gap-0.5">
                {isPositive && <CaretUp size={10} weight="bold" />}
                {isNegative && <CaretDown size={10} weight="bold" />}
                <span className="text-[10px] font-black uppercase tracking-tight">{Math.abs(val)}%</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tight opacity-90 ml-1">vs last month</span>
        </div>
    );
  };

  const proposalColumns = [
    {
      key: "task",
      label: "Task Details",
      render: (proposal) => (
        <>
          <p className="text-sm font-semibold text-foreground line-clamp-1">{proposal.taskId?.title || "Untitled task"}</p>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-bold">Budget: ${proposal.taskId?.budget?.toLocaleString()}</p>
        </>
      ),
    },
    {
      key: "company",
      label: "Company",
      render: (proposal) => {
        const company = proposal.companyId || {};
        const name = company.companyName || company.fullName || company.email || "Verified Company";
        return (
          <span className="text-sm font-bold text-foreground/90 uppercase tracking-tight">
            {name}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (proposal) => <StatusChip status={proposal.status} />,
    },
    {
      key: "bid",
      label: "My Bid",
      render: (proposal) => (
        <p className="text-sm font-black text-foreground">
            ${(proposal.bidAmount || 0).toLocaleString()}
        </p>
      ),
    },
    {
      key: "submitted",
      label: "Timeline",
      render: (proposal) => (
        <>
          <p className="text-sm text-foreground">{dayjs(proposal.submittedAt).format("MMM DD, YYYY")}</p>
          <p className="text-xs text-muted-foreground">{dayjs(proposal.submittedAt).fromNow()}</p>
        </>
      ),
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
              Show Details
            </DropdownMenuItem>

            {proposal.status === "submitted" && (
                <DropdownMenuItem onClick={() => {
                    setSelectedProposal(proposal);
                    setProposalUpdateOpen(true);
                }}>
                    <PencilSimple className="mr-2 h-4 w-4" />
                    Update Proposal
                </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem 
                onClick={() => handleOpenDeleteDialog(proposal)}
                className="text-error focus:text-error"
            >
              <Trash className="mr-2 h-4 w-4" />
              Withdraw Proposal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tabOptions = [
    { label: "All", count: proposals.length },
    { label: "Under Review", count: stats.submitted },
    { label: "Accepted", count: stats.accepted },
    { label: "Rejected", count: stats.rejected },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {loading ? (
          <div className="space-y-3">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
             </div>
             {Array.from({ length: 6 }).map((_, i) => (
               <Skeleton key={i} className="h-12 w-full rounded-xl" />
             ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Submissions" 
                value={stats.total} 
                icon={<Assignment />} 
                trend={<ChangeIndicator value={4.2} />}
              />
              <StatCard 
                title="Under Review" 
                value={stats.submitted} 
                icon={<PendingIcon />} 
                trend={<ChangeIndicator value={1.5} />}
              />
              <StatCard 
                title="Accepted Bids" 
                value={stats.accepted} 
                icon={<CheckCircle />} 
                trend={<ChangeIndicator value={12.0} />}
              />
              <StatCard 
                title="Rejected" 
                value={stats.rejected} 
                icon={<TrendUp />} 
                trend={<ChangeIndicator value={-2.1} />}
              />
            </div>

            <FilterSearchBar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="search by proposal title"
              activeTab={filter}
              onTabChange={(index) => {
                  setFilter(index);
                  const statuses = ["all", "submitted", "accepted", "rejected"];
                  setStatusFilter(statuses[index]);
              }}
              tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
              className="mb-0"
              actions={(
                <Button
                  variant="secondary"
                  onClick={() => navigate("/vendor/available-tasks")}
                >
                  Browse Marketplace
                </Button>
              )}
            />

            <div className="pt-6">
                <DataTable
                  columns={proposalColumns}
                  data={filteredProposals}
                  rowKey="_id"
                  showSectionHeader={false}
                  showTableHeader={true}
                  emptyState={
                    <EmptyState
                      icon={Assignment}
                      title="No proposals found"
                      description={searchTerm ? "Try adjusting your search criteria" : "Start bidding on available tasks to see them here"}
                      className="border-0 bg-transparent py-2"
                    />
                  }
                />
            </div>

            <ProposalDetailsModal
                open={detailsModalOpen}
                proposal={selectedProposal}
                onX={() => setDetailsModalOpen(false)}
            />

            <ProposalUpdateModal
                open={updateModalOpen}
                proposal={selectedProposal}
                onX={() => setProposalUpdateOpen(false)}
                onSuccess={fetchMyProposals}
            />

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {deletabilityInfo?.message || "Withdraw Proposal"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {deletabilityInfo?.warning || "Are you sure you want to withdraw this proposal? This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    {deletabilityInfo?.canDelete ? "Cancel" : "Close"}
                  </AlertDialogCancel>
                  {deletabilityInfo?.canDelete && (
                    <Button
                      variant={deletabilityInfo?.level === 2 ? "destructive" : "default"}
                      onClick={confirmDelete}
                      loading={isDeleting}
                      className="font-semibold uppercase tracking-tight text-[11px]"
                    >
                      Yes, Withdraw
                    </Button>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default MyProposals;

