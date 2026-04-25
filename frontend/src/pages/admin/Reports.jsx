import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText as ReportIcon,
  Clock as LogIcon,
  DownloadSimple,
  CurrencyDollar,
  Users as People,
  ClipboardText as TaskIcon,
  ShieldCheck,
  CaretUp,
  CaretDown,
  ListChecks,
  Monitor
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { 
    StatCard, 
    DataTable, 
    EmptyState, 
    PageTransition, 
    Skeleton, 
    Card, 
    Button,
    Badge
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import { adminService } from "@/services/api";
import toastUtil from "@/lib/toast";
import { cn } from "@/lib/cn";

dayjs.extend(relativeTime);

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
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border mt-1",
          colorClass
      )}>
          <div className="flex items-center gap-0.5">
              {isPositive && <CaretUp size={10} weight="bold" />}
              {isNegative && <CaretDown size={10} weight="bold" />}
              <span className="text-[10px] font-black uppercase tracking-tight">
                  {Math.abs(val)}%
              </span>
          </div>
      </div>
  );
};

const ReportActionCard = ({ title, description, onDownload, icon: Icon }) => (
    <Card className="hover:border-foreground/20 transition-all duration-300 group">
        <Card.Content className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Icon size={24} weight="duotone" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{title}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{description}</p>
                </div>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={onDownload}
                className="rounded-lg font-black uppercase tracking-tighter text-[10px] h-9 gap-2"
            >
                Export <DownloadSimple size={14} weight="bold" />
            </Button>
        </Card.Content>
    </Card>
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [activityRes, statsRes] = await Promise.all([
        adminService.getGlobalActivity(),
        adminService.getStats()
      ]);
      setActivities(activityRes.data?.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Reports load error:", error);
      toastUtil.handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLog = useMemo(() => {
    const query = searchTerm.toLowerCase();
    const typeFilter = ["all", "user", "task", "contract", "payment"][activeTab];

    return activities.filter(log => {
        const matchesSearch = log.action.toLowerCase().includes(query) || 
                            log.user.toLowerCase().includes(query);
        const matchesTab = typeFilter === "all" || log.type.toLowerCase() === typeFilter;
        return matchesSearch && matchesTab;
    });
  }, [activities, searchTerm, activeTab]);

  const logColumns = [
    {
        key: "action",
        label: "System Action",
        cellClassName: "px-6 py-4 text-sm font-semibold text-foreground",
        render: (log) => (
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    log.status === 'completed' || log.status === 'approved' ? 'bg-success' : 'bg-warning'
                )} />
                {log.action}
            </div>
        )
    },
    {
        key: "user",
        label: "Initiator",
        cellClassName: "px-6 py-4 text-sm text-muted-foreground font-medium",
        render: (log) => log.user
    },
    {
        key: "type",
        label: "Category",
        cellClassName: "px-6 py-4",
        render: (log) => (
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/50">
                {log.type}
            </Badge>
        )
    },
    {
        key: "time",
        label: "Timestamp",
        cellClassName: "px-6 py-4 text-sm text-muted-foreground",
        render: (log) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground/80">{dayjs(log.timestamp).format("MMM DD, HH:mm")}</span>
                <span className="text-[10px] uppercase font-black opacity-50">{dayjs(log.timestamp).fromNow()}</span>
            </div>
        )
    }
  ];

  const tabOptions = [
    { label: "All Logs", count: activities.length },
    { label: "Users", count: activities.filter(a => a.type === "USER").length },
    { label: "Tasks", count: activities.filter(a => a.type === "TASK").length },
    { label: "Contracts", count: activities.filter(a => a.type === "CONTRACT").length },
    { label: "Finance", count: activities.filter(a => a.type === "PAYMENT").length },
  ];

  const handleExport = (reportType) => {
    toastUtil.info(`Generating ${reportType} report...`);
  };

  if (loading && !stats) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Entities"
            value={stats?.marketplaceBalance?.reduce((sum, d) => sum + d.value, 0) || 0}
            icon={<People />}
            trend={<ChangeIndicator value={stats?.changes?.users} />}
          />
          <StatCard
            title="Platform Flow"
            value={`$${stats?.growthData?.reduce((sum, d) => sum + (d.totalVolume || 0), 0).toLocaleString() || 0}`}
            icon={<CurrencyDollar className="text-success" />}
            trend={<ChangeIndicator value={stats?.changes?.revenue} />}
          />
          <StatCard
            title="Active Tasks"
            value={stats?.taskFunnel?.find(f => f.name === 'Active Contracts')?.value || 0}
            icon={<TaskIcon />}
            trend={<ChangeIndicator value={stats?.changes?.tasks} />}
          />
          <StatCard
            title="Service Uptime"
            value="99.9%"
            icon={<ShieldCheck className="text-success" />}
          />
        </div>

        {/* Report Exports */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ReportActionCard 
                title="User Directory" 
                description="Registered Identities"
                icon={People}
                onDownload={() => handleExport('User')}
            />
            <ReportActionCard 
                title="Finance Audit" 
                description="Transaction Ledger"
                icon={CurrencyDollar}
                onDownload={() => handleExport('Finance')}
            />
            <ReportActionCard 
                title="Platform Audit" 
                description="Complete Execution Log"
                icon={Monitor}
                onDownload={() => handleExport('Platform')}
            />
        </div>

        <FilterSearchBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="search global activity logs..."
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
        />

        <DataTable
            columns={logColumns}
            data={filteredLog}
            rowKey="id"
            emptyState={
                <EmptyState
                    icon={LogIcon}
                    title="No system activity recorded"
                    description="Platform logs will populate as actions occur."
                    className="border-none bg-transparent py-10 shadow-none"
                />
            }
        />
      </div>
    </PageTransition>
  );
};

export default Reports;



