import React, { useMemo, useState, useEffect } from "react";
import { ClipboardText as Assignment, CheckCircle as CheckCircle, Clock as PendingIcon, TrendUp, ArrowsClockwise as ArrowsClockwise } from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "@/services/api";
import toastUtil from "@/lib/toast";
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
  Card,
  Loader,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FilterSearchBar from "@/components/shared/FilterSearchBar";

dayjs.extend(relativeTime);

const TaskMonitoring = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
  total: 0,
  active: 0,
  completed: 0,
  pending: 0,
  });

  useEffect(() => {
  fetchTasks();
  }, []);

  const fetchTasks = async () => {
  try {
  setLoading(true);
  const res = await api.get("/tasks/all");
  const allTasks = res.data || [];
  setTasks(allTasks);

  setStats({
  total: allTasks.length,
  active: allTasks.filter((t) => t.status === "in-progress").length,
  completed: allTasks.filter((t) => t.status === "completed").length,
  pending: allTasks.filter((t) => t.status === "open").length,
  });
  } catch (error) {
  console.error("Error fetching tasks:", error);
  toastUtil.handleApiError(error);
  } finally {
  setLoading(false);
  }
  };

  const filteredTasks = useMemo(() => tasks.filter((task) => {
  const matchesSearch =
  task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  task.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

  if (activeTab === 0) return matchesSearch;
  if (activeTab === 1) return matchesSearch && task.status === "open";
  if (activeTab === 2) return matchesSearch && task.status === "in-progress";
  if (activeTab === 3) return matchesSearch && task.status === "completed";
  return matchesSearch;
  }), [tasks, searchTerm, activeTab]);

  const chartData = [
  { name: "Open", value: stats.pending, color: "var(--muted-foreground)" },
  { name: "In Progress", value: stats.active, color: "var(--color-muted-foreground)" },
  { name: "Completed", value: stats.completed, color: "var(--color-primary)" },
  ];

  const statCards = [
  {
  title: "Total Tasks",
  value: stats.total,
  icon: <Assignment />,
  },
  {
  title: "Active Tasks",
  value: stats.active,
  icon: <TrendUp />,
  },
  {
  title: "Completed",
  value: stats.completed,
  icon: <CheckCircle />,
  },
  {
  title: "Pending",
  value: stats.pending,
  icon: <PendingIcon />,
  },
  ];

  const taskColumns = [
  {
  key: "title",
  label: "Task Title",
  cellClassName: "px-6 py-4 text-sm font-semibold text-[var(--foreground)]",
  render: (task) => task.title || "N/A",
  },
  {
  key: "company",
  label: "Company",
  cellClassName: "px-6 py-4 text-sm text-[var(--muted-foreground)]",
  render: (task) => task.companyName || "N/A",
  },
  {
  key: "status",
  label: "Status",
  cellClassName: "px-6 py-4",
  render: (task) => <StatusChip status={task.status || "open"} />,
  },
  {
  key: "createdAt",
  label: "Created",
  render: (task) => (
  <>
  <p className="text-sm text-[var(--foreground)]">
  {task.createdAt ? dayjs(task.createdAt).format("MMM DD, YYYY") : "N/A"}
  </p>
  {task.createdAt && (
  <p className="text-xs text-[var(--muted-foreground)]">
  {dayjs(task.createdAt).fromNow()}
  </p>
  )}
  </>
  ),
  },
  {
  key: "deadline",
  label: "Deadline",
  render: (task) => (
  <>
  <p className="text-sm text-[var(--foreground)]">
  {task.deadline ? dayjs(task.deadline).format("MMM DD, YYYY") : "N/A"}
  </p>
  {task.deadline && dayjs(task.deadline).isBefore(dayjs()) && task.status !== "completed" && (
  <p className="text-xs text-danger font-semibold">
  Overdue
  </p>
  )}
  </>
  ),
  },
  ];

  return (
  <PageTransition>
  <div className="space-y-8">
  {loading ? (
  <Loader />  ) : (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Task Monitoring</h1>
          <p className="text-[var(--muted-foreground)]">Monitor task throughput, timeline risk, and execution status across all companies.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" size="sm" icon={<ArrowsClockwise className="h-4 w-4" />} onClick={fetchTasks} disabled={loading}>
            ArrowsClockwise
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <StatCard key={`${stat.title}-${index}`} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Assignment className="h-5 w-5 text-[var(--foreground)]" />
              <Card.Title>Task Status Distribution</Card.Title>
            </div>
            <Card.Description>Current split across open, active, and completed work</Card.Description>
          </Card.Header>
          <Card.Content>
            <ChartContainer className="aspect-auto h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <TrendUp className="h-5 w-5 text-[var(--foreground)]" />
              <Card.Title>Task Trends</Card.Title>
            </div>
            <Card.Description>Task volume by current workflow stage</Card.Description>
          </Card.Header>
          <Card.Content>
            <ChartContainer className="aspect-auto h-[300px] w-full">
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          </Card.Content>
        </Card>
      </div>

      <FilterSearchBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="MagnifyingGlass tasks by title or company..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={["All Tasks", "Open", "In Progress", "Completed"]}
        actions={(
          <Button type="button" variant="secondary" size="sm" icon={<ArrowsClockwise className="h-4 w-4" />} onClick={fetchTasks}>
            ArrowsClockwise
          </Button>
        )}
      />

      <DataTable
        columns={taskColumns}
        data={filteredTasks}
        rowKey="_id"
        showSectionHeader
        icon={<Assignment className="h-5 w-5" />}
        title="Tracked Tasks"
        subtitle="All platform tasks, deadlines, and current execution status"
        emptyState={
          <EmptyState
            icon={Assignment}
            title="No tasks found"
            description={searchTerm ? "Try adjusting your search criteria" : "No tasks match the selected filter"}
            className="border-0 bg-transparent py-2 shadow-none"
          />
        }
      />
    </>
  )}
  </div>
  </PageTransition>
  );
};

export default TaskMonitoring;
