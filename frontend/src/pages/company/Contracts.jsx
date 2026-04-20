import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { contractAPI } from "@/services/api";
import { getUserData } from "@/lib/localStorage";
import { formatDate } from "@/lib/dateUtils";
import StatusChip from "@/components/shared/StatusChip";
import { FileText, CheckCircle as CheckCircle, ClipboardText as Assignment, CurrencyDollar as AttachMoney } from "@phosphor-icons/react";
import {
  Button,
  EmptyState,
  Skeleton,
  PageTransition,
  DataTable,
  StatCard,
  Loader,
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";

const CompanyContracts = () => {
  const navigate = useNavigate();
  const user = getUserData();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setMagnifyingGlass] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await contractAPI.getCompanyContracts(filter !== "all" ? filter : undefined);
        setContracts(res.data?.data || res.data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  const filtered = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        (contract.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (contract.vendorId?.username || "").toLowerCase().includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [contracts, search]);

  const stats = useMemo(() => {
    const active = contracts.filter((contract) => contract.status === "active" || contract.status === "pending-company" || contract.status === "pending-vendor").length;
    const completed = contracts.filter((contract) => contract.status === "completed").length;
    const totalBudget = contracts.reduce((sum, contract) => sum + (contract.totalBudget || 0), 0);
    return {
      total: contracts.length,
      active,
      completed,
      totalBudget,
    };
  }, [contracts]);

  const statusTabs = ["all", "draft", "pending-vendor", "pending-company", "active", "completed", "cancelled", "rejected"];

  const contractColumns = [
    {
      key: "title",
      label: "Contract",
      cellClassName: "px-6 py-4",
      render: (contract) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{contract.title || "Untitled Contract"}</p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            Task: {contract.taskId?.title || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "vendor",
      label: "Vendor",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]/80",
      render: (contract) => contract.vendorId?.username || "N/A",
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (contract) => <StatusChip status={contract.status} />,
    },
    {
      key: "budget",
      label: "Budget",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]/80",
      render: (contract) => (contract.totalBudget ? `PKR ${contract.totalBudget.toLocaleString()}` : "-"),
    },
    {
      key: "created",
      label: "Created",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]/80",
      render: (contract) => (contract.createdAt ? formatDate(contract.createdAt) : "N/A"),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "px-6 py-3",
      cellClassName: "px-6 py-4 text-right",
      render: (contract) => (
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => navigate(`/${user?.role}/contract/${contract._id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-[var(--muted-foreground)]">Monitor contract lifecycle, delivery milestones, and partner commitments.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Contracts" value={stats.total} icon={<FileText />} loading={loading} />
          <StatCard title="Active" value={stats.active} icon={<Assignment />} loading={loading} />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle />} loading={loading} />
          <StatCard title="Total Budget" value={`PKR ${stats.totalBudget.toLocaleString()}`} icon={<AttachMoney />} loading={loading} />
        </div>

        <FilterSearchBar
          searchValue={search}
          onSearchChange={setMagnifyingGlass}
          searchPlaceholder="MagnifyingGlass by contract title or vendor..."
          activeTab={statusTabs.indexOf(filter)}
          onTabChange={(index) => setFilter(statusTabs[index] || "all")}
          tabs={statusTabs.map((tab) => tab.replace(/-/g, " "))}
        />

        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No contracts found"
            description="Try adjusting your filters or search query"
          />
        ) : (
          <DataTable
            columns={contractColumns}
            data={filtered}
            rowKey="_id"
            showSectionHeader
            icon={<FileText className="h-5 w-5" />}
            title="Contract List"
            subtitle="All company contracts filtered by lifecycle status"
            tableClassName="w-full min-w-[900px]"
          />
        )}
      </div>
    </PageTransition>
  );
};


export default CompanyContracts;
