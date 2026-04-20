import React, { useEffect, useMemo, useState } from "react";
import { Receipt, CheckCircle as CheckCircle, ClipboardText as Assignment, CurrencyDollar as AttachMoney } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { proposalAPI } from "@/services/api";
import { Button, EmptyState, PageTransition, Loader, StatCard, DataTable } from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

const Contracts = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setMagnifyingGlass] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const res = await proposalAPI.getVendorProposals();
      setProposals(res.data || []);
    } catch (error) {
      console.error("Contracts load error:", error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const contracts = useMemo(() => {
    return proposals
      .filter((p) => p.status === "accepted")
      .map((p) => ({
        id: p._id,
        taskTitle: p.taskId?.title || "Untitled Task",
        company: p.companyId?.companyName || p.companyId?.username || "Company",
        companyUser: p.companyId || null,
        value: p.bidAmount || 0,
        acceptedAt: p.acceptedAt,
        taskStatus: p.taskId?.status || "in-progress",
      }));
  }, [proposals]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.taskTitle.toLowerCase().includes(search.toLowerCase()) ||
        contract.company.toLowerCase().includes(search.toLowerCase());

      if (tab === 0) return matchesSearch;
      if (tab === 1) return matchesSearch && contract.taskStatus !== "completed";
      return matchesSearch && contract.taskStatus === "completed";
    });
  }, [contracts, search, tab]);

  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.taskStatus !== "completed").length;
    const completed = contracts.filter((c) => c.taskStatus === "completed").length;
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
    return {
      total: contracts.length,
      active,
      completed,
      totalValue,
    };
  }, [contracts]);

  const contractColumns = [
    {
      key: "task",
      label: "Task",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]",
      render: (contract) => contract.taskTitle,
    },
    {
      key: "company",
      label: "Company",
      cellClassName: "px-6 py-4",
      render: (contract) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={contract.companyUser || {}} name={contract.company} size="md" />
          <span className="whitespace-nowrap text-sm text-[var(--muted-foreground)]">{contract.company}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Task Status",
      cellClassName: "px-6 py-4 whitespace-nowrap",
      render: (contract) => <StatusChip status={contract.taskStatus} />,
    },
    {
      key: "value",
      label: "Value",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]",
      render: (contract) => `$${contract.value.toLocaleString()}`,
    },
    {
      key: "accepted",
      label: "Accepted",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]",
      render: (contract) => (contract.acceptedAt ? dayjs(contract.acceptedAt).format("MMM DD, YYYY") : "N/A"),
    },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value={stats.total}
          icon={<Receipt />}
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<Assignment />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle />}
        />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={<AttachMoney />}
        />
      </div>

      <FilterSearchBar
        searchValue={search}
        onSearchChange={setMagnifyingGlass}
        searchPlaceholder="MagnifyingGlass by task or company..."
        activeTab={tab}
        onTabChange={setTab}
        tabs={["All", "Active", "Completed"]}
      />

      {loading ? (
        <Loader />
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No contracts yet"
          description="Accepted proposals will appear here."
          action={(
            <Button onClick={() => navigate("/vendor/available-tasks")}>
              Browse Available Tasks
            </Button>
          )}
        />
      ) : (
        <DataTable
          columns={contractColumns}
          data={filteredContracts}
          rowKey="id"
          showSectionHeader
          icon={<Receipt className="h-5 w-5" />}
          title="Accepted Work"
          subtitle="Contracts derived from accepted proposals and their current task status"
          tableClassName="w-full min-w-[860px]"
          bodyClassName="divide-y divide-border"
          rowClassName="hover:bg-[var(--muted)]"
        />
      )}
    </div>
    </PageTransition>
  );
};

export default Contracts;
