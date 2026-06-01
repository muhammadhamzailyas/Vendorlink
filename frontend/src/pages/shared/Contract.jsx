import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
  FileText as Description, 
  CheckCircle, 
  ClipboardText as Assignment, 
  TrendUp, 
  CurrencyDollar, 
  CaretUp, 
  CaretDown,
  Briefcase
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import { adminService } from "@/services/api";
import { useUser } from "@/context/UserContext";
import { 
  EmptyState, 
  PageTransition, 
  Skeleton, 
  StatCard, 
  DataTable, 
  Badge 
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";
import ContractActionMenu from "@/components/admin/ContractActionMenu";
import ContractDetailsModal from "@/components/admin/ContractDetailsModal";
import toastUtil from "@/lib/toast";
import { cn } from "@/lib/cn";

const ChangeIndicator = ({ value }) => {
  const val = parseFloat(value || 0);
  const isPositive = val > 0;
  const isNegative = val < 0;
  
  const colorClass = isPositive 
      ? "bg-success/20 text-success border-success/30" 
      : isNegative 
          ? "bg-error/20 text-error border-error/30" 
          : "bg-muted text-muted-foreground border-border";

  return (
      <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border mt-1",
          colorClass
      )}>
          <div className="flex items-center gap-0.5">
              {isPositive && <CaretUp size={10} weight="bold" />}
              {isNegative && <CaretDown size={10} weight="bold" />}
              <span className="text-[10px] font-black uppercase tracking-tight">
                  {Math.abs(val)}%
              </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tight opacity-90 ml-1">
              from last month
          </span>
      </div>
  );
};

const Contract = () => {
  const { user } = useUser();
  const role = user?.role;

  const [rows, setRows] = useState([]);
  const [monitorData, setMonitorData] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedContract, setSelectedTask] = useState(null);

  const loadData = useCallback(async () => {
    if (!role) return;

    setLoading(true);
    try {
      if (role === "admin") {
        const [contractsRes, monitorRes] = await Promise.all([
            adminService.getAllContracts(),
            adminService.getContractMonitoring()
        ]);
        
        const contractData = contractsRes.data?.data || contractsRes.data || [];
        setRows(contractData);
        setMonitorData(monitorRes.data);
      }
    } catch (error) {
      console.error("Contract page load error:", error);
      toastUtil.handleApiError(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const query = search.toLowerCase();
      const matchesSearch = row.title?.toLowerCase().includes(query);

      const currentFilter = ["all", "active", "completed", "cancelled", "rejected"][tab];
      const matchesTab = currentFilter === "all" || row.status === currentFilter;

      return matchesSearch && matchesTab;
    });
  }, [rows, search, tab]);

  const stats = useMemo(() => {
    if (monitorData?.stats) {
        return monitorData.stats;
    }
    const active = rows.filter((r) => r.status === "active").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const totalValue = rows.reduce((sum, r) => sum + (r.totalBudget || 0), 0);
    return {
      total: rows.length,
      active,
      completed,
      totalValue,
    };
  }, [rows, monitorData]);

  const handleViewDetails = (contract) => {
    setSelectedTask(contract);
    setViewModalOpen(true);
  };

  const contractColumns = [
    {
      key: "title",
      label: "Contract Title",
      cellClassName: "px-6 py-4 text-sm font-semibold text-foreground",
      render: (row) => row.title,
    },
    {
      key: "company",
      label: "Company",
      cellClassName: "px-6 py-4",
      render: (row) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={row.companyId || {}} name={row.companyId?.companyName || row.companyId?.fullName || row.companyId?.email} size="md" />
          <span className="text-sm text-foreground/80 font-medium">{row.companyId?.companyName || row.companyId?.fullName || row.companyId?.email}</span>
        </div>
      ),
    },
    {
        key: "vendor",
        label: "Vendor",
        cellClassName: "px-6 py-4",
        render: (row) => (
          <div className="flex items-center gap-2">
            <UserAvatar user={row.vendorId || {}} name={row.vendorId?.fullName || row.vendorId?.email} size="md" />
            <span className="text-sm text-foreground/80 font-medium">{row.vendorId?.fullName || row.vendorId?.email}</span>
          </div>
        ),
      },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "value",
      label: "Budget",
      cellClassName: "px-6 py-4 text-sm font-bold text-foreground",
      render: (row) => `$${(row.totalBudget || 0).toLocaleString()}`,
    },
    {
      key: "updated",
      label: "Last Updated",
      cellClassName: "px-6 py-4 text-sm text-muted-foreground",
      render: (row) => (
        <>
            <div>{dayjs(row.updatedAt).format("MMM DD, YYYY")}</div>
            <div className="text-[10px] uppercase font-black opacity-50">{dayjs(row.updatedAt).fromNow()}</div>
        </>
      ),
    },
    {
        key: "actions",
        label: "",
        headerClassName: "relative px-6 py-3",
        cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
        render: (row) => (
          <ContractActionMenu
            onView={() => handleViewDetails(row)}
          />
        ),
    },
  ];

  const tabOptions = [
    { label: "All Contracts", count: rows.length },
    { label: "Active", count: rows.filter(r => r.status === "active").length },
    { label: "Completed", count: rows.filter(r => r.status === "completed").length },
    { label: "Cancelled", count: rows.filter(r => r.status === "cancelled").length },
    { label: "Rejected", count: rows.filter(r => r.status === "rejected").length },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value={stats.total}
          loading={loading}
          icon={<Description />}
          trend={<ChangeIndicator value={stats.changes?.total} />}
        />
        <StatCard
          title="Active Execution"
          value={stats.active}
          loading={loading}
          icon={<Briefcase />}
        />
        <StatCard
          title="Success Rate"
          value={stats.completed}
          loading={loading}
          icon={<CheckCircle />}
        />
        <StatCard
          title="Platform Volume"
          value={`$${stats.totalValue?.toLocaleString()}`}
          loading={loading}
          icon={<CurrencyDollar className="text-success" />}
        />
      </div>

      <FilterSearchBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="search by contract title"
        activeTab={tab}
        onTabChange={setTab}
        tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
      />

      {loading ? (
        <Skeleton className="h-96 w-full rounded-xl bg-muted" />
      ) : (
        <DataTable
          columns={contractColumns}
          data={filteredRows}
          rowKey="_id"
          emptyState={
            <EmptyState
              icon={Description}
              title="No contract records found"
              description={search ? "Try adjusting your search criteria" : "Active agreements across the platform will appear here."}
              className="border-0 bg-transparent py-2 shadow-none"
            />
          }
        />
      )}

      <ContractDetailsModal
        open={viewModalOpen}
        contract={selectedContract}
        onX={() => setViewModalOpen(false)}
      />
    </div>
    </PageTransition>
  );
};

export default Contract;




