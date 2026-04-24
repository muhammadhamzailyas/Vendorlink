import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft as ArrowBack,
  ClipboardText as Assignment,
  CheckCircle,
  XCircle,
  Clock,
  ChatCircleText as Chat,
  Signature as Contract
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { proposalAPI } from "@/services/api";
import { Button, Dialog, EmptyState, PageTransition, Skeleton, DataTable, StatCard, Loader } from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

dayjs.extend(relativeTime);

const FILTER_TABS = ["All", "Submitted", "Accepted", "Rejected"];
const FILTER_VALUES = ["all", "submitted", "accepted", "rejected"];

const CompanyProposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [filterTab, setFilterTab] = useState(0);
  const [search, setMagnifyingGlass] = useState("");
  const [loading, setLoading] = useState(true);
  const [showActionButtons, setShowActionButtons] = useState(true);
  const [decisionDialog, setDecisionDialog] = useState({
    open: false,
    proposal: null,
    action: null,
  });

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const res = await proposalAPI.getCompanyProposals();
      setProposals(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const activeFilter = FILTER_VALUES[filterTab] || "all";

  const handleAccept = async (id) => {
    await proposalAPI.accept(id);
    await loadProposals();
  };

  const handleReject = async (id) => {
    await proposalAPI.reject(id);
    await loadProposals();
  };

  const filtered = useMemo(() => {
    return proposals.filter((proposal) => {
      const matchesFilter = activeFilter === "all" || proposal.status === activeFilter;
      const taskTitle = proposal.taskId?.title || proposal.task?.title || "";
      const vendorName = proposal.vendorId?.username || proposal.vendorId?.companyName || "";
      const query = search.toLowerCase();
      const matchesSearch =
        taskTitle.toLowerCase().includes(query) ||
        vendorName.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [proposals, activeFilter, search]);

  const stats = useMemo(() => ({
    total: proposals.length,
    submitted: proposals.filter((proposal) => proposal.status === "submitted").length,
    accepted: proposals.filter((proposal) => proposal.status === "accepted").length,
    rejected: proposals.filter((proposal) => proposal.status === "rejected").length,
  }), [proposals]);

  const proposalColumns = [
    {
      key: "task",
      label: "Task",
      cellClassName: "px-6 py-4",
      render: (proposal) => {
        const taskTitle = proposal.taskId?.title || proposal.task?.title || "Untitled task";
        return <p className="text-sm font-semibold text-foreground">{taskTitle}</p>;
      },
    },
    {
      key: "vendor",
      label: "Vendor",
      cellClassName: "px-6 py-4",
      render: (proposal) => {
        const vendor = proposal.vendorId || {};
        const vendorName = vendor.username || vendor.companyName || vendor.email || "Vendor";
        return (
          <div className="flex items-center gap-2">
            <UserAvatar user={vendor} name={vendorName} size="md" />
            <span className="text-sm text-foreground/80">{vendorName}</span>
          </div>
        );
      },
    },
    {
      key: "bid",
      label: "Bid",
      cellClassName: "px-6 py-4 text-sm text-foreground",
      render: (proposal) => `$${(proposal.bidAmount || 0).toLocaleString()}`,
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (proposal) => <StatusChip status={proposal.status || "submitted"} />,
    },
    {
      key: "submitted",
      label: "Submitted",
      cellClassName: "px-6 py-4",
      render: (proposal) => {
        const createdAt = proposal.submittedAt || proposal.createdAt;
        return (
          <>
            <p className="text-sm text-foreground">{createdAt ? dayjs(createdAt).format("MMM DD, YYYY") : "-"}</p>
            <p className="text-xs text-muted-foreground">{createdAt ? dayjs(createdAt).fromNow() : ""}</p>
          </>
        );
      },
    },
  ];

  const handleOpenDialog = (proposal, action) => {
    setDecisionDialog({ open: true, proposal, action });
  };

  const handleXDialog = () => {
    setDecisionDialog({ open: false, proposal: null, action: null });
  };

  const handleConfirmDialog = async () => {
    if (!decisionDialog.proposal) {
      return;
    }

    if (decisionDialog.action === "accept") {
      await handleAccept(decisionDialog.proposal._id);
    } else {
      await handleReject(decisionDialog.proposal._id);
    }

    handleXDialog();
  };

  const emptyTitle = activeFilter === "all" ? "No proposals received yet" : `No ${activeFilter} proposals`;
  const emptyDescription = activeFilter === "all"
    ? "Proposal submissions from vendors will appear here once tasks start attracting bids."
    : "Try switching filters or reviewing another proposal status.";

  return (
    <PageTransition>
      <div className="space-y-8">
        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total" value={stats.total} icon={<Assignment />} />
              <StatCard title="Submitted" value={stats.submitted} icon={<Clock />} />
              <StatCard title="Accepted" value={stats.accepted} icon={<CheckCircle />} />
              <StatCard title="Rejected" value={stats.rejected} icon={<XCircle />} />
            </div>

            <FilterSearchBar
              searchValue={search}
              onSearchChange={setMagnifyingGlass}
              searchPlaceholder="MagnifyingGlass by task or vendor..."
              activeTab={filterTab}
              onTabChange={setFilterTab}
              tabs={FILTER_TABS}
              actions={(
                <Button
                  variant="secondary"
                  onClick={() => setShowActionButtons((value) => !value)}
                >
                  {showActionButtons ? "Hide Actions" : "Show Actions"}
                </Button>
              )}
            />

            <DataTable
              columns={proposalColumns}
              data={filtered}
              rowKey="_id"
              showSectionHeader
              icon={<Assignment className="h-5 w-5" />}
              title="Proposal Queue"
              subtitle="Incoming bids across current company task postings"
              emptyState={(
                <EmptyState
                  icon={activeFilter === "accepted" ? CheckCircle : activeFilter === "rejected" ? XCircle : activeFilter === "submitted" ? Clock : Assignment}
                  title={emptyTitle}
                  description={emptyDescription}
                  className="border-0 bg-transparent py-6 shadow-none"
                />
              )}
              emptyCellClassName="px-6 py-14 text-center"
              showRowActions={showActionButtons}
              rowActions={(proposal) => {
                if (proposal.status === "submitted") {
                  return [
                    {
                      key: "accept",
                      label: "Accept",
                      icon: <CheckCircle className="h-3.5 w-3.5" />,
                      onClick: (row) => handleOpenDialog(row, "accept"),
                      className: "inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-white hover:bg-foreground-light",
                    },
                    {
                      key: "reject",
                      label: "Reject",
                      icon: <XCircle className="h-3.5 w-3.5" />,
                      onClick: (row) => handleOpenDialog(row, "reject"),
                      className: "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted",
                    },
                  ];
                }
                
                if (proposal.status === "accepted") {
                  return [
                    {
                      key: "contract",
                      label: "Contract",
                      icon: <Contract className="h-3.5 w-3.5" />,
                      onClick: (row) => navigate(`/company/contracts/create?proposalId=${row._id}`),
                      className: "inline-flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-white hover:bg-foreground-light",
                    },
                    {
                      key: "chat",
                      label: "Chat",
                      icon: <Chat className="h-3.5 w-3.5" />,
                      onClick: (row) => navigate(`/company/chat?taskId=${row.taskId?._id || row.task?._id}`),
                      className: "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-muted",
                    },
                  ];
                }

                return [];
              }}
            />
          </>
        )}

        <Dialog open={decisionDialog.open} onX={handleXDialog}>
          <Dialog.Header onX={handleXDialog}>
            <Dialog.Title>
              {decisionDialog.action === "accept" ? "Accept Proposal" : "Reject Proposal"}
            </Dialog.Title>
            <Dialog.Description>
              {decisionDialog.action === "accept"
                ? "The selected vendor proposal will be accepted and removed from the pending review queue."
                : "This proposal will be marked as rejected and moved out of the submitted queue."}
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-foreground/80">
              <p className="font-semibold text-foreground">
                {decisionDialog.proposal?.taskId?.title || decisionDialog.proposal?.task?.title || "Untitled task"}
              </p>
              <p className="mt-1 text-muted-foreground">
                Vendor: {decisionDialog.proposal?.vendorId?.username || decisionDialog.proposal?.vendorId?.companyName || decisionDialog.proposal?.vendorId?.email || "Vendor"}
              </p>
              <p className="mt-1 text-muted-foreground">
                Bid: ${Number(decisionDialog.proposal?.bidAmount || 0).toLocaleString()}
              </p>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button type="button" variant="secondary" onClick={handleXDialog}>Cancel</Button>
            <Button
              type="button"
              variant={decisionDialog.action === "accept" ? "success" : "danger"}
              onClick={handleConfirmDialog}
            >
              {decisionDialog.action === "accept" ? "Accept Proposal" : "Reject Proposal"}
            </Button>
          </Dialog.Footer>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default CompanyProposals;



