import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardText as Assignment,
  CheckCircle as CheckCircle,
  Clock as PendingIcon,
  XCircle as Cancel,
  Eye as Visibility,
  Briefcase,
} from "@phosphor-icons/react";
import { proposalAPI } from "@/services/api";
import { formatDate } from "@/lib/dateUtils";
import { Button, EmptyState, PageTransition, Loader, StatCard, DataTable } from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

const MyProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActionButtons, setShowActionButtons] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProposals();
  }, []);

  const fetchMyProposals = async () => {
    try {
      setLoading(true);
      const { data } = await proposalAPI.getVendorProposals();
      setProposals(data);
    } catch (error) {
      console.error("Proposals fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilterValue = useCallback(() => {
    const filters = ["all", "submitted", "accepted", "rejected"];
    return filters[filter];
  }, [filter]);

  const filteredProposals = useMemo(() => proposals.filter((p) => {
    const filterValue = getFilterValue();
    const matchesFilter = filterValue === "all" || p.status === filterValue;
    const matchesSearch =
      p.taskId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companyId?.companyName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [proposals, searchTerm, getFilterValue]);

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
      render: (proposal) => (
        <>
          <p className="text-sm font-semibold text-[var(--foreground)]">{proposal.taskId?.title || "Untitled task"}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Budget: ${proposal.taskId?.budget?.toLocaleString() || "0"}</p>
        </>
      ),
    },
    {
      key: "company",
      label: "Company",
      cellClassName: "px-6 py-4",
      render: (proposal) => {
        const company = proposal.companyId || {};
        const companyName = company.companyName || company.username || company.email || "Company";
        return (
          <div className="flex items-center gap-2">
            <UserAvatar user={company} name={companyName} size="md" />
            <span className="text-sm text-[var(--foreground)]/80">{companyName}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (proposal) => <StatusChip status={proposal.status} />,
    },
    {
      key: "bid",
      label: "Bid",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]",
      render: (proposal) => `$${proposal.bidAmount?.toLocaleString() || "0"}`,
    },
    {
      key: "submitted",
      label: "Submitted",
      cellClassName: "px-6 py-4",
      render: (proposal) => (
        <>
          <p className="text-sm text-[var(--foreground)]">{formatDate(proposal.submittedAt)}</p>
          <p className="text-xs text-[var(--muted-foreground)]">Deadline: {formatDate(proposal.proposedDeadline)}</p>
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={<Assignment />} loading={loading} />
        <StatCard title="Under Review" value={stats.submitted} icon={<PendingIcon />} loading={loading} />
        <StatCard title="Accepted" value={stats.accepted} icon={<CheckCircle />} loading={loading} />
        <StatCard title="Rejected" value={stats.rejected} icon={<Cancel />} loading={loading} />
      </div>

      <FilterSearchBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="MagnifyingGlass proposals..."
        activeTab={filter}
        onTabChange={setFilter}
        tabs={["All", "Under Review", "Accepted", "Rejected"]}
        actions={(
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowActionButtons((value) => !value)}
          >
            {showActionButtons ? "Hide Actions" : "Show Actions"}
          </Button>
        )}
      />

      {filteredProposals.length === 0 ? (
        <EmptyState
          icon={getFilterValue() === "accepted" ? CheckCircle : getFilterValue() === "rejected" ? Cancel : getFilterValue() === "submitted" ? PendingIcon : Assignment}
          title={getFilterValue() === "all" ? "No proposals submitted yet" : `No ${getFilterValue()} proposals`}
          description={getFilterValue() === "all" ? "Browse available tasks and submit your first proposal." : "Try switching filters or reviewing other proposal statuses."}
          action={(
            <Button
              onClick={
                getFilterValue() === "all"
                  ? () => navigate("/vendor/available-tasks")
                  : () => setFilter(0)
              }
            >
              {getFilterValue() === "all" ? "Browse Tasks" : "Show All Proposals"}
            </Button>
          )}
        />
      ) : (
        <DataTable
          columns={proposalColumns}
          data={filteredProposals}
          rowKey="_id"
          showSectionHeader
          icon={<Assignment className="h-5 w-5" />}
          title="Proposal History"
          subtitle="All vendor submissions with company responses and task access links"
          showRowActions={showActionButtons}
          rowActions={(proposal) => {
            const actions = [
              {
                key: "view-task",
                label: "View Task",
                icon: <Visibility className="h-3.5 w-3.5" />,
                onClick: (row) => navigate(`/vendor/task/${row.taskId?._id}`),
                className: "inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]/80 hover:bg-[var(--muted)]",
              },
            ];

            if (proposal.status === "accepted") {
              actions.push({
                key: "contracts",
                label: "Contracts",
                icon: <Briefcase className="h-3.5 w-3.5" />,
                onClick: () => navigate("/vendor/contracts"),
                className: "inline-flex items-center gap-1 rounded-lg bg-[var(--foreground)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--foreground)]-light",
              });
            }

            return actions;
          }}
        />
      )}
    </div>
    </PageTransition>
  );
};

export default MyProposals;
