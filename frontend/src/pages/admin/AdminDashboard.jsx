import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users as People,
  Buildings as Business,
  Storefront,
  Clock as Pending,
  TrendUp,
  CurrencyDollar,
  Funnel,
  Pulse,
  ChartPie,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import {
  Button,
  PageTransition,
  Skeleton,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DataTable,
  StatCard,
  Card,
  Badge,
} from "@/components/ui";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { adminService } from "@/services/api";
import { useUser } from "@/context/UserContext";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

dayjs.extend(relativeTime);
import { cn } from "@/lib/cn";
import { usePageMeta } from "@/hooks/usePageMeta";

const AdminDashboard = () => {
  usePageMeta("Admin Dashboard", "Overview of platform activity and growth");
  const navigate = useNavigate();
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalVendors: 0,
    pendingApprovals: 0,
    growthData: [],
    marketplaceBalance: [],
    taskFunnel: [],
    withdrawalHealth: [],
    changes: { users: 0, tasks: 0, revenue: 0 }
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "admin") {
        fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, pendingRes, statsRes] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getPendingVerifications(),
        adminService.getStats(),
      ]);

      const users = usersRes.data || [];
      const pending = pendingRes.data || [];
      const statsData = statsRes.data || {};

      const validUsers = users.filter(user => user.role !== 'unassigned');
      validUsers.sort((a, b) => {
        const dateA = a.lastLogin ? new Date(a.lastLogin) : new Date(a.createdAt);
        const dateB = b.lastLogin ? new Date(b.lastLogin) : new Date(b.createdAt);
        return dateB - dateA;
      });

      setStats({
        totalUsers: validUsers.filter(u => u.status === 'approved').length,
        totalCompanies: validUsers.filter((u) => u.role === "company" && u.status === 'approved').length,
        totalVendors: validUsers.filter((u) => u.role === "vendor" && u.status === 'approved').length,
        pendingApprovals: pending.length,
        ...statsData
      });

      setRecentUsers(validUsers.slice(0, 5));
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) return;
      console.error("Error fetching dashboard data:", error);
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
                from last month
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

  const sortedRecentUsers = [...recentUsers].sort((a, b) => {
    const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
    const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
    return dateB - dateA;
  });

  const recentUserColumns = [
    {
      key: "user",
      label: "User",
      cellClassName: "px-6 py-4",
      render: (user) => (
        <div className="flex items-center gap-3">
          <UserAvatar user={user} name={user.companyName || user.fullName || user.email} size="md" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {user.companyName || user.fullName || user.email || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      cellClassName: "px-6 py-4 text-sm text-foreground/80 capitalize",
      render: (user) => user.role,
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (user) => <StatusChip status={user.status || "pending"} />, 
    },
    {
      key: "lastLogin",
      label: "Last Login",
      cellClassName: "px-6 py-4",
      render: (user) => (
        <>
          <p className="text-sm text-foreground">
            {user.lastLogin ? dayjs(user.lastLogin).format("MMM DD, YYYY hh:mm A") : "Never"}
          </p>
          <p className="text-xs text-muted-foreground">
            {user.lastLogin ? dayjs(user.lastLogin).fromNow() : "-"}
          </p>
        </>
      ),
    },
  ];

    return (
    <PageTransition>
    <div className="space-y-8">
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
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={<People />}
                loading={loading}
                trend={<ChangeIndicator value={stats.changes.users} />}
            />
            <StatCard
                title="Companies"
                value={stats.totalCompanies}
                icon={<Business />}
                loading={loading}
                trend={<ChangeIndicator value={stats.changes.companies} />}
            />
            <StatCard
                title="Vendors"
                value={stats.totalVendors}
                icon={<Storefront />}
                loading={loading}
                trend={<ChangeIndicator value={stats.changes.vendors} />}
            />
            <StatCard
                title="Pending Approvals"
                value={stats.pendingApprovals}
                icon={<Pending />}
                loading={loading}
                trend={<ChangeIndicator value={stats.changes.pending} />}
            />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 1. Cumulative Platform Growth (Area Chart) */}
            <div className="lg:col-span-8">
                <Card>
                <Card.Header className="pb-2 border-b-0">
                    <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <TrendUp className="h-5 w-5 text-success" />
                        <div>
                            <Card.Title className="text-sm uppercase tracking-tight text-foreground">Platform Growth</Card.Title>
                            <Card.Description className="text-xs text-muted-foreground">Cumulative users and tasks over time</Card.Description>
                        </div>
                    </div>
                    {!loading && <ChangeIndicator value={stats.changes.tasks} />}
                    </div>
                </Card.Header>
                <Card.Content className="h-[340px]">
                    {loading ? <div className="flex h-full items-center justify-center"><Pulse size={32} className="opacity-20 animate-pulse" /></div> : stats.growthData.length === 0 ? <NoInfo message="No growth info available" /> : (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                        <ResponsiveContainer width="100%" height={300} minWidth={0}>
                        <AreaChart data={stats.growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#262626" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#262626" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="users" stroke="#262626" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                            <Area type="monotone" dataKey="tasks" stroke="#a3a3a3" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    )}
                </Card.Content>
                </Card>
            </div>

            {/* 3. Marketplace Balance (Donut Chart) */}
            <div className="lg:col-span-4">
                <Card>
                <Card.Header className="pb-2 border-b-0">
                    <div className="flex items-center gap-2">
                        <ChartPie className="h-5 w-5 text-info" />
                        <div>
                            <Card.Title className="text-sm uppercase tracking-tight text-foreground">Marketplace Balance</Card.Title>
                            <Card.Description className="text-xs text-muted-foreground">Ratio of vendors to companies</Card.Description>
                        </div>
                    </div>
                </Card.Header>
                <Card.Content className="h-[340px] flex flex-col justify-center">
                    {loading ? <div className="flex h-full items-center justify-center"><Pulse size={32} className="opacity-20 animate-pulse" /></div> : stats.marketplaceBalance.length === 0 ? <NoInfo message="No balance info available" /> : (
                    <>
                        <ChartContainer className="h-[240px] w-full overflow-hidden">
                            <ResponsiveContainer width="100%" height={240} minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={stats.marketplaceBalance}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#262626" />
                                    <Cell fill="#d4d4d4" />
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="mt-4 flex flex-wrap justify-center gap-6">
                            {stats.marketplaceBalance.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: index === 0 ? '#262626' : '#d4d4d4' }} />
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

            {/* 2. Revenue vs. Payout Gap (Stacked Bar Chart) */}
            <div className="lg:col-span-6">
                <Card>
                <Card.Header className="pb-2 border-b-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <CurrencyDollar className="h-5 w-5 text-success" />
                            <div>
                                <Card.Title className="text-sm uppercase tracking-tight text-foreground">Financial Health</Card.Title>
                                <Card.Description className="text-xs text-muted-foreground">Total volume vs. platform revenue (5%)</Card.Description>
                            </div>
                        </div>
                        {!loading && <ChangeIndicator value={stats.changes.revenue} />}
                    </div>
                </Card.Header>
                <Card.Content className="h-[300px]">
                    {loading ? <div className="flex h-full items-center justify-center"><Pulse size={32} className="opacity-20 animate-pulse" /></div> : stats.growthData.filter(d => d.totalVolume > 0).length === 0 ? <NoInfo message="No financial info available" /> : (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                        <ResponsiveContainer width="100%" height={260} minWidth={0}>
                        <BarChart data={stats.growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Bar dataKey="totalVolume" stackId="a" fill="#a3a3a3" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="revenue" stackId="a" fill="#262626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    )}
                </Card.Content>
                </Card>
            </div>

            {/* 4. Task Conversion Funnel (Bar Chart) */}
            <div className="lg:col-span-6">
                <Card>
                <Card.Header className="pb-2 border-b-0">
                    <div className="flex items-center gap-2">
                        <Funnel className="h-5 w-5 text-warning" />
                        <div>
                            <Card.Title className="text-sm uppercase tracking-tight text-foreground">Task Conversion Funnel</Card.Title>
                            <Card.Description className="text-xs text-muted-foreground">Efficiency from posting to completion</Card.Description>
                        </div>
                    </div>
                </Card.Header>
                <Card.Content className="h-[300px]">
                    {loading ? <div className="flex h-full items-center justify-center"><Pulse size={32} className="opacity-20 animate-pulse" /></div> : stats.taskFunnel.every(f => f.value === 0) ? <NoInfo message="No funnel info available" /> : (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                        <ResponsiveContainer width="100%" height={260} minWidth={0}>
                        <BarChart layout="vertical" data={stats.taskFunnel} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#e5e5e5', fontSize: 10}} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#e5e5e5', fontSize: 10, fontWeight: 'bold'}} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="#404040" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    )}
                </Card.Content>
                </Card>
            </div>

            {/* 5. Settlement & Withdrawal Health (Pie Chart) */}
            <div className="lg:col-span-12">
                <Card>
                    <Card.Header className="pb-2 border-b-0">
                    <div className="flex items-center gap-2">
                        <Pulse className="h-5 w-5 text-error" />
                        <div>
                            <Card.Title className="text-sm uppercase tracking-tight text-foreground">Withdrawal Health</Card.Title>
                            <Card.Description className="text-xs text-muted-foreground">Status of pending and completed payouts</Card.Description>
                        </div>
                    </div>
                    </Card.Header>
                    <Card.Content className="flex items-center justify-between py-6 min-h-[200px]">
                        {loading ? <div className="flex h-full w-full items-center justify-center"><Pulse size={32} className="opacity-20 animate-pulse" /></div> : stats.withdrawalHealth.length === 0 ? <NoInfo message="No withdrawal data available yet" /> : (
                            <>
                                <div className="w-1/3 h-[200px]">
                                    <ResponsiveContainer width="100%" height={200} minWidth={0}>
                                        <PieChart>
                                            <Pie
                                                data={stats.withdrawalHealth}
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {stats.withdrawalHealth.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.name === 'Completed' ? 'var(--color-success)' : entry.name === 'Pending' ? '#ffc658' : '#f87171'} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-2/3 grid grid-cols-3 gap-4 px-12">
                                    {stats.withdrawalHealth.map((entry, index) => (
                                        <div key={entry.name} className="p-4 rounded-xl bg-muted/50 border border-border">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{entry.name}</p>
                                            <p className="text-2xl font-bold text-foreground">{entry.value}</p>
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
            columns={recentUserColumns}
            data={sortedRecentUsers}
            rowKey="_id"
            showSectionHeader
            icon={<People size={24} />}
            title="Recent Users"
            subtitle="Sorted by most recent login"
            action={(
                <Button
                onClick={() => navigate("/admin/users")}
                variant="secondary"
                className="w-full sm:w-auto"
                >
                View All Users
                </Button>
            )}
            emptyState="No recent users available."
            />
          </>
        )}
    </div>
    </PageTransition>
  );
};

export default AdminDashboard;




