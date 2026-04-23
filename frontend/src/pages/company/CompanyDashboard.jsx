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
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { taskAPI, proposalAPI } from "@/services/api";
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
import StatusChip from "@/components/shared/StatusChip";
import ApprovalStatusBanner from "@/components/ApprovalStatusBanner";

dayjs.extend(relativeTime);

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingProposals: 0,
    activeTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [tasksRes, proposalsRes] = await Promise.all([
        taskAPI.getCompanyTasks().catch(() => ({ data: [] })),
        proposalAPI.getCompanyProposals().catch(() => ({ data: [] })),
      ]);

      const tasksData = tasksRes.data || [];
      const proposalsData = proposalsRes.data || [];

      setTasks(tasksData);
      setProposals(proposalsData);

      setStats({
        totalTasks: tasksData.length,
        pendingProposals: proposalsData.filter((p) => p.status === "submitted").length,
        activeTasks: tasksData.filter((t) => t.status === "in-progress").length,
        completedTasks: tasksData.filter((t) => t.status === "completed").length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const taskStatusData = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;

    return [
      { name: "Open", value: open, color: "var(--muted-foreground)" },
      { name: "In Progress", value: inProgress, color: "var(--color-muted-foreground)" },
      { name: "Completed", value: completed, color: "var(--color-primary)" },
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
        month: month.format("MMM"),
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
          <p className="text-sm font-semibold text-[var(--foreground)]">{task.title || "Untitled task"}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{task.category || "General"}</p>
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
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]",
      render: (task) => `$${(task.budget || 0).toLocaleString()}`,
    },
    {
      key: "proposals",
      label: "Proposals",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]/80",
      render: (task) => proposalsByTaskId[task._id] || 0,
    },
    {
      key: "created",
      label: "Created",
      cellClassName: "px-6 py-4",
      render: (task) => (
        <>
          <p className="text-sm text-[var(--foreground)]">{dayjs(task.createdAt).format("MMM DD, YYYY")}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{dayjs(task.createdAt).fromNow()}</p>
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
          <ApprovalStatusBanner />
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                icon={<ArrowRight className="h-4 w-4" />}
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
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Tasks" value={stats.totalTasks} icon={<Assignment />} link="/company/my-tasks" />
            <StatCard title="Pending Proposals" value={stats.pendingProposals} icon={<Pending />} link="/company/proposals" />
            <StatCard title="Active Tasks" value={stats.activeTasks} icon={<CheckCircle />} link="/company/my-tasks?status=in-progress" />
            <StatCard title="Completed" value={stats.completedTasks} icon={<TrendUp />} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Card>
                <Card.Header className="pb-2">
                  <div className="flex items-center gap-2">
                      <TrendUp className="h-5 w-5 text-[var(--foreground)]" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight">Task Pulse Trends</Card.Title>
                          <Card.Description className="text-xs">Task creation volume across the last six months</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  <ChartContainer className="h-[260px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tasksOverTimeData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="tasks" stroke="var(--color-primary)" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card>
                <Card.Header className="pb-2">
                  <div className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-[var(--foreground)]" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight">Task Status Split</Card.Title>
                          <Card.Description className="text-xs">Open, active, and completed work</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  {taskStatusData.length > 0 ? (
                      <>
                      <ChartContainer className="h-[230px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                          <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={58} outerRadius={90} dataKey="value" strokeWidth={5} stroke="var(--color-card)">
                              {taskStatusData.map((entry, index) => (
                              <Cell key={`task-status-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                          {taskStatusData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-[11px] font-bold uppercase tracking-tight text-[var(--muted-foreground)]">{entry.name}</span>
                          </div>
                          ))}
                      </div>
                      </>
                  ) : (
                      <EmptyState
                      icon={PieChartIcon}
                      title="No task status data yet"
                      description="Status distribution will appear after tasks move through the workflow."
                      className="border-0 bg-transparent px-0 py-10 shadow-none mt-4"
                      />
                  )}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card>
                <Card.Header className="pb-2">
                  <div className="flex items-center gap-2">
                      <BarChartIcon className="h-5 w-5 text-[var(--foreground)]" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight">Proposals per Task</Card.Title>
                          <Card.Description className="text-xs">Top 5 tasks by proposal count</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  {proposalsPerTaskData.length > 0 ? (
                    <ChartContainer className="h-[250px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={proposalsPerTaskData} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} tickMargin={10} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tickMargin={10} width={100} />
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                          <Bar dataKey="proposals" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <EmptyState
                      icon={BarChartIcon}
                      title="No proposals received yet"
                      description="Proposal volume by task will appear once vendors start submitting bids."
                      className="border-0 bg-transparent px-0 py-10 shadow-none mt-4"
                    />
                  )}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card>
                <Card.Header className="pb-2">
                  <div className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-[var(--foreground)]" />
                      <div>
                          <Card.Title className="text-sm uppercase tracking-tight">Budget Allocation</Card.Title>
                          <Card.Description className="text-xs">Spending distribution by category</Card.Description>
                      </div>
                  </div>
                </Card.Header>
                <Card.Content>
                  {budgetByCategoryData.length > 0 ? (
                    <ChartContainer className="h-[250px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetByCategoryData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                          <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                          <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `$${value.toLocaleString()}`} />} />
                          <Bar dataKey="budget" fill="var(--color-muted-foreground)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <EmptyState
                      icon={PieChartIcon}
                      title="No budget data available"
                      description="Budget allocation becomes visible after tasks with category budgets are posted."
                      className="border-0 bg-transparent px-0 py-10 shadow-none mt-4"
                    />
                  )}
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
            emptyCellClassName="px-6 py-10 text-center text-sm text-[var(--muted-foreground)]"
          />
        </>
      )}
    </div>
    </PageTransition>
  );
};

export default CompanyDashboard;
