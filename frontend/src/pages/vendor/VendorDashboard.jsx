import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardText as Assignment,
  CheckCircle,
  Receipt,
  CurrencyDollar as AttachMoney,
  ChartPie as PieChartIcon,
  TrendUp,
  ChartBar as BarChartIcon,
  Briefcase,
  ArrowRight,
  Pulse,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api, { dashboardAPI } from "@/services/api";
import StatusChip from "@/components/shared/StatusChip";
import {
  Button,
  EmptyState,
  PageTransition,
  Loader,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DataTable,
  StatCard,
  Card,
  Skeleton,
} from "@/components/ui";
import { useWallet } from "@/context/WalletContext";
import { cn } from "@/lib/cn";

dayjs.extend(relativeTime);

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { wallet, formatCurrency } = useWallet();
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    assignedProjects: 0,
    submittedProposals: 0,
    ongoingWork: 0,
    weeklyEarnings: 0,
    changes: { projects: 0, proposals: 0, work: 0, earnings: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [proposalsRes, contractsRes, statsRes] = await Promise.all([
        api.get("/proposals/vendor/my-proposals").catch(() => ({ data: [] })),
        api.get("/contracts/vendor/my-contracts").catch(() => ({ data: [] })),
        dashboardAPI.getStats().catch(() => ({ data: { stats: {}, changes: {} } })),
      ]);

      const proposalsData = Array.isArray(proposalsRes.data) ? proposalsRes.data : proposalsRes.data?.data || [];
      const contractsData = Array.isArray(contractsRes.data) ? contractsRes.data : contractsRes.data?.data || [];
      const dashboardData = statsRes.data || { stats: {}, changes: {} };

      setProposals(proposalsData);
      setContracts(contractsData);

      setStats({
        assignedProjects: dashboardData.stats.acceptedProposals || contractsData.filter((c) => c.status === "active").length,
        submittedProposals: dashboardData.stats.totalProposals || proposalsData.length,
        ongoingWork: dashboardData.stats.activeContracts || contractsData.filter((c) => c.status === "active" || c.status === "pending-vendor").length,
        weeklyEarnings: dashboardData.stats.totalEarned || contractsData
          .filter((c) => c.status === "active" || c.status === "completed")
          .reduce((sum, c) => sum + (c.totalBudget || 0), 0),
        changes: {
          projects: dashboardData.changes.accepted || 0,
          proposals: dashboardData.changes.proposals || 0,
          work: dashboardData.changes.active || 0,
          earnings: dashboardData.changes.earnings || 0
        }
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-[9px] font-bold uppercase tracking-tight opacity-90">
                vs last month
            </span>
        </div>
    );
  };

  const NoInfo = ({ message = "No data available yet" }) => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 opacity-50">
        <Pulse size={32} weight="thin" className="animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
    </div>
  );

  const earningsOverTimeData = useMemo(() => {
    const last6Months = [];
    const now = dayjs();

    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, "month");
      const monthKey = month.format("YYYY-MM");
      const monthEarnings = contracts
        .filter((contract) => dayjs(contract.createdAt).format("YYYY-MM") === monthKey)
        .reduce((sum, c) => sum + (c.totalBudget || 0), 0);

      last6Months.push({
        name: month.format("MMM"),
        earnings: monthEarnings,
      });
    }
    return last6Months;
  }, [contracts]);

  const proposalStatusData = useMemo(() => {
    const pending = proposals.filter((p) => p.status === "pending" || p.status === "submitted").length;
    const accepted = proposals.filter((p) => p.status === "accepted").length;
    const rejected = proposals.filter((p) => p.status === "rejected").length;

    return [
      { name: "Accepted", value: accepted },
      { name: "Pending", value: pending },
      { name: "Rejected", value: rejected },
    ].filter((item) => item.value > 0);
  }, [proposals]);

  const recentProposalColumns = [
    {
      key: "task",
      label: "Task",
      cellClassName: "px-6 py-4",
      render: (proposal) => (
        <>
          <p className="text-sm font-semibold text-foreground">{proposal.taskId?.title || "Untitled task"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Proposal #{proposal._id?.slice(-6).toUpperCase() || "N/A"}</p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (proposal) => <StatusChip status={proposal.status || "submitted"} />,
    },
    {
      key: "bid",
      label: "Bid",
      cellClassName: "px-6 py-4 text-sm text-foreground font-bold",
      render: (proposal) => `$ ${(proposal.bidAmount || 0).toLocaleString()}`,
    },
    {
      key: "submitted",
      label: "Submitted",
      cellClassName: "px-6 py-4",
      render: (proposal) => (
        <>
          <p className="text-sm text-foreground">{dayjs(proposal.createdAt).format("MMM DD, YYYY")}</p>
          <p className="text-xs text-muted-foreground">{dayjs(proposal.createdAt).fromNow()}</p>
        </>
      ),
    },
  ];

  return (
    <PageTransition>
      {loading ? (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Skeleton className="lg:col-span-8 h-[400px] w-full rounded-xl" />
                <Skeleton className="lg:col-span-4 h-[400px] w-full rounded-xl" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
            </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid-cols-2 grid grid-wrap gap-3 sm:ml-auto">
              <Button
                variant="secondary"
                onClick={() => navigate("/vendor/available-tasks")}
                className="w-full sm:w-auto font-bold uppercase tracking-tight text-[11px]"
              >
                Browse Tasks
                
              </Button>
              <Button
                onClick={() => navigate("/vendor/my-proposals")}
                className="w-full sm:w-auto font-bold uppercase tracking-tight text-[11px]"
              >
                My Proposals
              </Button></div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Assigned Projects" 
              value={stats.assignedProjects} 
              icon={<Assignment />} 
              trend={<ChangeIndicator value={stats.changes.projects} />}
            />
            <StatCard 
              title="Wallet Balance" 
              value={formatCurrency(wallet?.balance)} 
              icon={<AttachMoney />} 
            />
            <StatCard 
              title="Active Work" 
              value={stats.ongoingWork} 
              icon={<Receipt />} 
              trend={<ChangeIndicator value={stats.changes.work} />}
            />
            <StatCard 
              title="Gross Earnings" 
              value={`$${stats.weeklyEarnings.toLocaleString()}`} 
              icon={<TrendUp />} 
              trend={<ChangeIndicator value={stats.changes.earnings} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Earnings Growth (Area Chart - matching Admin styling) */}
            <div className="lg:col-span-8">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <AttachMoney className="h-5 w-5 text-success" />
                      <div>
                        <Card.Title className="text-sm uppercase tracking-tight text-foreground">Earnings Overview</Card.Title>
                        <Card.Description className="text-xs text-muted-foreground">Monthly revenue growth from contracts</Card.Description>
                      </div>
                    </div>
                    <ChangeIndicator value={stats.changes.earnings} />
                  </div>
                </Card.Header>
                <Card.Content className="h-[340px]">
                  {earningsOverTimeData.length === 0 ? <NoInfo /> : (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={earningsOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#262626" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#262626" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#a3a3a3', fontSize: 10}} />
                          <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#a3a3a3', fontSize: 10}} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="earnings" stroke="#262626" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </Card.Content>
              </Card>
            </div>

            {/* Proposal Outcomes (Donut Chart - matching Admin styling) */}
            <div className="lg:col-span-4">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-info" />
                    <div>
                      <Card.Title className="text-sm uppercase tracking-tight text-foreground">Proposal Status</Card.Title>
                      <Card.Description className="text-xs text-muted-foreground">Success rate of your submissions</Card.Description>
                    </div>
                  </div>
                </Card.Header>
                <Card.Content className="h-[340px] flex flex-col justify-center">
                  {proposalStatusData.length === 0 ? <NoInfo /> : (
                    <>
                      <ChartContainer className="h-[240px] w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={proposalStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#262626" />
                              <Cell fill="#a3a3a3" />
                              <Cell fill="#d4d4d4" />
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-4 flex flex-wrap justify-center gap-4">
                        {proposalStatusData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: index === 0 ? '#262626' : index === 1 ? '#a3a3a3' : '#d4d4d4' }} />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                              {entry.name}: {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card.Content>
              </Card>
            </div>
          </div>

          <DataTable
            columns={recentProposalColumns}
            data={proposals.slice(0, 5)}
            rowKey="_id"
            showSectionHeader
            icon={<Briefcase size={22} weight="bold" />}
            title="Recent Proposals"
            subtitle="Monitor the status of your latest bids"
            emptyState="No proposals found yet."
            emptyCellClassName="px-6 py-10 text-center text-sm text-muted-foreground"
          />
        </div>
      )}
    </PageTransition>
  );
};

export default VendorDashboard;

