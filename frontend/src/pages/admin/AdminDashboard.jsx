import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users as People,
  Buildings as Business,
  Storefront,
  Clock as Pending,
  TrendUp,
  ArrowsClockwise,
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
  Card
} from "@/components/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { adminService } from "@/services/api";
import { getUserData } from "@/lib/localStorage";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

dayjs.extend(relativeTime);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalVendors: 0,
    pendingApprovals: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUserData();
    if (user && user.role === "admin") {
        fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, pendingRes] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getPendingUsers(),
      ]);

      const users = usersRes.data || [];
      const pending = pendingRes.data || [];

      setStats({
        totalUsers: users.length,
        totalCompanies: users.filter((u) => u.role === "company").length,
        totalVendors: users.filter((u) => u.role === "vendor").length,
        pendingApprovals: pending.length,
      });

      setRecentUsers(users.slice(0, 5));
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) return;
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Jan", users: 10, tasks: 5 },
    { name: "Feb", users: 15, tasks: 8 },
    { name: "Mar", users: 25, tasks: 12 },
    { name: "Apr", users: 35, tasks: 20 },
    { name: "May", users: 50, tasks: 28 },
    { name: "Jun", users: 65, tasks: 35 },
  ];

  const pieData = [
    { name: "Companies", value: stats.totalCompanies },
    { name: "Vendors", value: stats.totalVendors },
  ];

  const recentUserColumns = [
    {
      key: "user",
      label: "User",
      cellClassName: "px-6 py-4",
      render: (user) => (
        <div className="flex items-center gap-3">
          <UserAvatar user={user} name={user.companyName || user.username || user.email} size="md" />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {user.companyName || user.username || "N/A"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]/80 capitalize",
      render: (user) => user.role,
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (user) => <StatusChip status={user.status || "pending"} />, 
    },
    {
      key: "registered",
      label: "Registered",
      cellClassName: "px-6 py-4",
      render: (user) => (
        <>
          <p className="text-sm text-[var(--foreground)]">
            {dayjs(user.createdAt).format("MMM DD, YYYY")}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {dayjs(user.createdAt).fromNow()}
          </p>
        </>
      ),
    },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase">Admin Overview</h2>
               <p className="text-sm text-[var(--muted-foreground)]">Monitor platform growth and activity.</p>
            </div>
            <Button variant="secondary" icon={<ArrowsClockwise className="h-4 w-4" />} onClick={fetchDashboardData}>Refresh</Button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<People />}
              link="/admin/users"
            />
            <StatCard
              title="Companies"
              value={stats.totalCompanies}
              icon={<Business />}
              link="/admin/users?role=company"
            />
            <StatCard
              title="Vendors"
              value={stats.totalVendors}
              icon={<Storefront />}
              link="/admin/users?role=vendor"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              icon={<Pending />}
              link="/admin/pending"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                      <TrendUp className="h-5 w-5 text-[var(--success)]" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight text-[var(--foreground)]">Growth Trends</Card.Title>
                          <Card.Description className="text-xs text-[var(--muted-foreground)]">Monthly user and task growth momentum</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content className="min-h-[340px]">
                  <ChartContainer className="h-[300px] w-full mt-4 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                      <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: 'var(--muted-foreground)', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: 'var(--muted-foreground)', fontSize: 12}} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="users" stroke="var(--foreground)" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="tasks" stroke="var(--muted-foreground)" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </Card.Content>
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                      <People className="h-5 w-5 text-[var(--info)]" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight text-[var(--foreground)]">User Distribution</Card.Title>
                          <Card.Description className="text-xs text-[var(--muted-foreground)]">Split between companies and vendors</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content className="min-h-[300px]">
                  <ChartContainer className="h-[260px] w-full mt-4 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                      <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            strokeWidth={5}
                            stroke="var(--card)"
                        >
                            <Cell fill="var(--foreground)" />
                            <Cell fill="var(--muted)" />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-4 flex flex-wrap justify-center gap-6">
                      <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--foreground)]" />
                      <span className="text-xs font-bold uppercase tracking-tight text-[var(--muted-foreground)]">Companies</span>
                      </div>
                      <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--muted)] border border-[var(--border)]" />
                      <span className="text-xs font-bold uppercase tracking-tight text-[var(--muted-foreground)]">Vendors</span>
                      </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          </div>

          <DataTable
            columns={recentUserColumns}
            data={recentUsers}
            rowKey="_id"
            showSectionHeader
            icon={<People size={24} />}
            title="Recent Users"
            subtitle="Latest registered users on the platform"
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
