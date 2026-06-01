import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardText as Assignment,
  Clock as Pending,
  CheckCircle as CheckCircle,
  TrendUp,
  ChartPie as PieChartIcon,
  ChartBar as BarChartIcon,
  Briefcase,
  ArrowRight,
  Pulse,
  CaretUp,
  CaretDown,
  Funnel,
  CurrencyDollar,
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
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { taskAPI, proposalAPI, dashboardAPI } from "@/services/api";
import {
  Button,
  EmptyState,
  PageTransition,
  Skeleton,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DataTable,
  StatCard,
  Card
} from "@/components/ui";
import { useWallet } from "@/context/WalletContext";
import StatusChip from "@/components/shared/StatusChip";
import { cn } from "@/lib/cn";

dayjs.extend(relativeTime);

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { wallet, formatCurrency } = useWallet();
  const [tasks, setTasks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingProposals: 0,
    activeTasks: 0,
    completedTasks: 0,
    changes: { tasks: 0, proposals: 0, active: 0, completed: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [tasksRes, proposalsRes, statsRes] = await Promise.all([
        taskAPI.getCompanyTasks().catch(() => ({ data: [] })),
        proposalAPI.getCompanyProposals().catch(() => ({ data: [] })),
        dashboardAPI.getStats().catch(() => ({ data: { stats: {}, changes: {} } })),
      ]);

      const tasksData = tasksRes.data || [];
      const proposalsData = proposalsRes.data || [];
      const dashboardData = statsRes.data || { stats: {}, changes: {} };

      setTasks(tasksData);
      setProposals(proposalsData);

      setStats({
        totalTasks: dashboardData.stats.totalTasks || tasksData.length,
        pendingProposals: dashboardData.stats.totalProposals || proposalsData.filter((p) => p.status === "submitted").length,
        activeTasks: dashboardData.stats.activeContracts || tasksData.filter((t) => t.status === "in-progress").length,
        completedTasks: dashboardData.stats.completedTasks || tasksData.filter((t) => t.status === "completed").length,
        changes: dashboardData.changes || { tasks: 0, proposals: 0, active: 0, completed: 0 }
      });
    } catch (error) {
      console.error("Error loading stats:", error);
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
            <span className="text-[9px] font-bold uppercase tracking-tight opacity-90 ml-1">
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

  const taskStatusData = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;

    return [
      { name: "Open", value: open, color: "#262626" },
      { name: "In Progress", value: inProgress, color: "#a3a3a3" },
      { name: "Completed", value: completed, color: "#d4d4d4" },
    ].filter((item) => item.value > 0);
  }, [tasks]);

  const proposalsPerTaskData = useMemo(() => {
    const taskProposalCounts = tasks.map((task) => ({
      name: task.title?.substring(0, 15) + (task.title?.length > 15 ? "..." : "") || "Untitled",
      proposals: proposals.filter((p) => p.task === task._id || p.task?._id === task._id).length,
    }));

    return taskProposalCounts
      .filter((t) => t.proposals > 0)
      .sort((a, b) => b.proposals - a.proposals)
      .slice(0, 5);
  }, [tasks, proposals]);

  const tasksOverTimeData = useMemo(() => {
    const last6Months = [];
    const now = dayjs();

    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, "month");
      const monthKey = month.format("YYYY-MM");

      const count = tasks.filter((task) => {
        const taskDate = dayjs(task.createdAt);
        return taskDate.format("YYYY-MM") === monthKey;
      }).length;

      last6Months.push({
        name: month.format("MMM"),
        tasks: count,
      });
    }

    return last6Months;
  }, [tasks]);

  const budgetByCategoryData = useMemo(() => {
    const categoryBudgets = {};

    tasks.forEach((task) => {
      const category = task.category || "Other";
      const budget = task.budget || 0;
      categoryBudgets[category] = (categoryBudgets[category] || 0) + budget;
    });

    return Object.entries(categoryBudgets)
      .map(([name, budget]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " "),
        budget,
      }))
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 5);
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 5);
  }, [tasks]);

  const proposalsByTaskId = useMemo(() => {
    return proposals.reduce((acc, proposal) => {
      const taskId = proposal.task?._id || proposal.task;
      if (!taskId) return acc;
      acc[taskId] = (acc[taskId] || 0) + 1;
      return acc;
    }, {});
  }, [proposals]);

  const recentTaskColumns = [
    {
      key: "task",
      label: "Task",
      cellClassName: "px-6 py-4",
      render: (task) => (
        <>
          <p className="text-sm font-semibold text-foreground">{task.title || "Untitled task"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{task.category || "General"}</p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (task) => <StatusChip status={task.status || "open"} />,
    },
    {
      key: "budget",
      label: "Budget",
      cellClassName: "px-6 py-4 text-sm text-foreground",
      render: (task) => `$${(task.budget || 0).toLocaleString()}`,
    },
    {
      key: "proposals",
      label: "Proposals",
      cellClassName: "px-6 py-4 text-sm text-foreground/80",
      render: (task) => proposalsByTaskId[task._id] || 0,
    },
    {
      key: "created",
      label: "Created",
      cellClassName: "px-6 py-4",
      render: (task) => (
        <>
          <p className="text-sm text-foreground">{dayjs(task.createdAt).format("MMM DD, YYYY")}</p>
          <p className="text-xs text-muted-foreground">{dayjs(task.createdAt).fromNow()}</p>
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
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="grid-cols-2 grid grid-wrap gap-3">
              <Button
                variant="secondary"
               
                onClick={() => navigate("/company/add-task")}
                className="w-full sm:w-auto"
              >
                Post New Task
              </Button>
              <Button
                onClick={() => navigate("/company/proposals")}
                className="w-full sm:w-auto"
              >
                Review Proposals
              </Button></div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Tasks" 
              value={stats.totalTasks} 
              icon={<Assignment />} 
              trend={<ChangeIndicator value={stats.changes.tasks} />}
            />
            <StatCard 
              title="Pending Bids" 
              value={stats.pendingProposals} 
              icon={<Pending />} 
              trend={<ChangeIndicator value={stats.changes.proposals} />}
            />
            <StatCard 
              title="Active Work" 
              value={stats.activeTasks} 
              icon={<CheckCircle />} 
              trend={<ChangeIndicator value={stats.changes.active} />}
            />
            <StatCard 
              title="Wallet Balance" 
              value={formatCurrency(wallet?.balance)} 
              icon={<CurrencyDollar />} 
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                      <TrendUp className="h-5 w-5 text-success" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight text-foreground">Task Pulse Trends</Card.Title>
                          <Card.Description className="text-xs text-muted-foreground">Task creation volume across the last six months</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content className="h-[340px]">
                  {tasksOverTimeData.length > 0 ? (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                      <ResponsiveContainer width="100%" height={300} minWidth={0}>
                        <AreaChart data={tasksOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#262626" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#262626" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                          <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area type="monotone" dataKey="tasks" stroke="#262626" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : <NoInfo />}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-info" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight text-foreground">Task Status Split</Card.Title>
                          <Card.Description className="text-xs text-muted-foreground">Open, active, and completed work</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content className="h-[340px] flex flex-col justify-center">
                  {taskStatusData.length > 0 ? (
                      <>
                      <ChartContainer className="h-[240px] w-full overflow-hidden">
                        <ResponsiveContainer width="100%" height={240} minWidth={0}>
                          <PieChart>
                          <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {taskStatusData.map((entry, index) => (
                              <Cell key={`task-status-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
                          {taskStatusData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{entry.name}</span>
                          </div>
                          ))}
                      </div>
                      </>
                  ) : <NoInfo />}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                      <Funnel className="h-5 w-5 text-warning" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight text-foreground">Proposals per Task</Card.Title>
                          <Card.Description className="text-xs text-muted-foreground">Top 5 tasks by proposal count</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content className="h-[300px]">
                  {proposalsPerTaskData.length > 0 ? (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                      <ResponsiveContainer width="100%" height={260} minWidth={0}>
                        <BarChart data={proposalsPerTaskData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                          <XAxis type="number" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#e5e5e5', fontSize: 10, fontWeight: 'bold'}} width={100} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="proposals" fill="#404040" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : <NoInfo />}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card>
                <Card.Header className="pb-2 border-b-0">
                  <div className="flex items-center gap-2">
                      <CurrencyDollar className="h-5 w-5 text-success" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight text-foreground">Budget Allocation</Card.Title>
                          <Card.Description className="text-xs text-muted-foreground">Spending distribution by category</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content className="h-[300px]">
                  {budgetByCategoryData.length > 0 ? (
                    <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                      <ResponsiveContainer width="100%" height={260} minWidth={0}>
                        <BarChart data={budgetByCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                          <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${value.toLocaleString()}`} />} />
                          <Bar dataKey="budget" fill="#262626" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : <NoInfo />}
                </Card.Content>
              </Card>
            </div>
          </div>

          <DataTable
            columns={recentTaskColumns}
            data={recentTasks}
            rowKey="_id"
            showSectionHeader
            icon={<Briefcase size={22} />}
            title="Recent Tasks"
            subtitle="Track latest tasks and proposal activity"
            emptyState="No tasks found yet."
            emptyCellClassName="px-6 py-10 text-center text-sm text-muted-foreground"
          />
        </>
      )}
    </div>
    </PageTransition>
  );
};

export default CompanyDashboard;




