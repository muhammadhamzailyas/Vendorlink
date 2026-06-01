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
      </div>
  );
};

const ReportActionCard = ({ title, description, onDownload, icon: Icon }) => (
    <Card className="hover:border-border/80 transition-all duration-300">
        <Card.Content className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted text-muted-foreground">
                    <Icon size={24} weight="duotone" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{title}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{description}</p>
                </div>
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                onClick={onDownload}
                className="rounded-lg font-semibold uppercase tracking-tighter text-[10px] h-9 gap-2 bg-muted/50 hover:bg-muted text-foreground border-none shadow-none"
            >
                <DownloadSimple size={15} weight="bold" />
                Export 
            </Button>
        </Card.Content>
    </Card>
);

import { usePageMeta } from "@/hooks/usePageMeta";

const Reports = () => {
  usePageMeta("Reports", "Platform performance snapshot for users and tasks");
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

  const handleExport = async (reportType) => {
    try {
      const toastId = toastUtil.info(`Generating ${reportType} PDF report...`);
      let response;
      let filename = `${reportType.toLowerCase()}_report_${dayjs().format("YYYY-MM-DD")}.pdf`;

      if (reportType === 'User') {
        response = await adminService.getUserReport();
      } else if (reportType === 'Finance') {
        response = await adminService.getFinanceReport();
      } else if (reportType === 'Platform') {
        response = await adminService.getTaskReport();
      }

      if (response && response.data) {
        const [{ pdf }, { default: AdminReportsPDF }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/components/admin/AdminReportsPDF"),
        ]);

        const blob = await pdf(<AdminReportsPDF type={reportType} data={response.data} />).toBlob();
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toastUtil.success(`${reportType} report downloaded as PDF`);
      }
    } catch (error) {
      console.error(`Error exporting ${reportType} report:`, error);
      toastUtil.error(`Failed to generate PDF report`);
    }
  };

  if (loading && !stats) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
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
            noHover
          />
          <StatCard
            title="Platform Flow"
            value={`$${stats?.growthData?.reduce((sum, d) => sum + (d.totalVolume || 0), 0).toLocaleString() || 0}`}
            icon={<CurrencyDollar className="text-success" />}
            trend={<ChangeIndicator value={stats?.changes?.revenue} />}
            noHover
          />
          <StatCard
            title="Active Tasks"
            value={stats?.taskFunnel?.find(f => f.name === 'Active Contracts')?.value || 0}
            icon={<TaskIcon />}
            trend={<ChangeIndicator value={stats?.changes?.tasks} />}
            noHover
          />
          <StatCard
            title="Service Uptime"
            value="99.9%"
            icon={<ShieldCheck className="text-success" />}
            noHover
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
            searchPlaceholder="Search activity logs by action or user..."
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




