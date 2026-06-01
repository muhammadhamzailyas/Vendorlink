import React, { useEffect, useMemo, useState } from "react";
import { 
  Receipt, 
  CheckCircle, 
  ClipboardText as Assignment, 
  CurrencyDollar as AttachMoney,
  DotsThreeVertical,
  Eye as Visibility,
  CaretUp,
  CaretDown,
  TrendUp
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { contractAPI } from "@/services/api";
import { 
  Button, 
  EmptyState, 
  PageTransition, 
  Loader, 
  StatCard, 
  DataTable,
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";
import { cn } from "@/lib/cn";
import toastUtil from "@/lib/toast";
import ContractDetailsModal from "@/components/admin/ContractDetailsModal";

dayjs.extend(relativeTime);

const VendorContracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  useEffect(() => {
    loadContracts();
  }, [filter]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await contractAPI.getVendorContracts(filter !== "all" ? filter : undefined);
      setContracts(res.data?.data || res.data || []);
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        (contract.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (contract.companyId?.companyName || "").toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [contracts, search]);

  const stats = useMemo(() => {
    const active = contracts.filter((c) => ["active", "pending-vendor", "pending-company"].includes(c.status)).length;
    const completed = contracts.filter((c) => c.status === "completed").length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.totalBudget || 0), 0);
    return {
      total: contracts.length,
      active,
      completed,
      totalValue,
    };
  }, [contracts]);

  const ChangeIndicator = ({ value }) => {
    const val = parseFloat(value || 0);
    const isPositive = val > 0;
    const colorClass = isPositive ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground border-border";

    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border mt-1", colorClass)}>
            <div className="flex items-center gap-0.5">
                {isPositive && <CaretUp size={10} weight="bold" />}
                <span className="text-[10px] font-black uppercase tracking-tight">{Math.abs(val)}%</span>
            </div>
        </div>
    );
  };

  const statusTabs = ["all", "pending-vendor", "pending-company", "active", "completed", "cancelled", "rejected"];

  const contractColumns = [
    {
      key: "title",
      label: "Agreement Title",
      cellClassName: "px-6 py-4",
      render: (contract) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground uppercase tracking-tight">{contract.title || "Untitled Contract"}</p>
          <p className="mt-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            TASK: {contract.taskId?.title || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "company",
      label: "Client Company",
      cellClassName: "px-6 py-4",
      render: (contract) => (
        <div className="flex items-center gap-3">
          <UserAvatar user={contract.companyId || {}} name={contract.companyId?.companyName} size="xs" />
          <span className="text-sm font-bold text-foreground/90 uppercase tracking-tight">
            {contract.companyId?.companyName || contract.companyId?.fullName || contract.companyId?.email || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (contract) => <StatusChip status={contract.status} size="small" />,
    },
    {
      key: "budget",
      label: "Budget",
      cellClassName: "px-6 py-4 text-sm text-foreground font-black",
      render: (contract) => (contract.totalBudget ? `$${contract.totalBudget.toLocaleString()}` : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      cellClassName: "px-6 py-4 text-right",
      render: (contract) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <DotsThreeVertical size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => {
              setSelectedContract(contract);
              setDetailsModalOpen(true);
            }}>
              <Visibility className="mr-2 h-4 w-4" />
              View Contract
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tabOptions = useMemo(() => {
    return statusTabs.map(s => ({
        label: s.replace(/-/g, " "),
        count: contracts.filter(c => s === 'all' ? true : c.status === s).length
    }));
  }, [contracts]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="All Agreements" value={stats.total} icon={<Receipt />} trend={<ChangeIndicator value={2.1} />} />
          <StatCard title="Active Work" value={stats.active} icon={<Assignment />} trend={<ChangeIndicator value={5.4} />} />
          <StatCard title="Completions" value={stats.completed} icon={<CheckCircle />} trend={<ChangeIndicator value={12.0} />} />
          <StatCard title="Projected Revenue" value={`$${stats.totalValue.toLocaleString()}`} icon={<AttachMoney />} trend={<ChangeIndicator value={8.7} />} />
        </div>

        <FilterSearchBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search agreements by task or client..."
          activeTab={statusTabs.indexOf(filter)}
          onTabChange={(index) => setFilter(statusTabs[index] || "all")}
          tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
          className="mb-0"
        />

        {loading ? (
          <div className="space-y-3">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
             </div>
             {Array.from({ length: 6 }).map((_, i) => (
               <Skeleton key={i} className="h-12 w-full rounded-xl" />
             ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No contracts found"
            description={search ? "Try adjusting your search criteria" : "Your active agreements will appear here."}
            className="border-0 bg-transparent py-12"
          />
        ) : (
          <div className="pt-6">
            <DataTable
                columns={contractColumns}
                data={filtered}
                rowKey="_id"
                showSectionHeader={false}
                showTableHeader={true}
                tableClassName="w-full min-w-[900px]"
            />
          </div>
        )}

        <ContractDetailsModal
            open={detailsModalOpen}
            contract={selectedContract}
            onX={() => setDetailsModalOpen(false)}
        />
      </div>
    </PageTransition>
  );
};

export default VendorContracts;







