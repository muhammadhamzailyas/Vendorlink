import React, { useMemo, useState, useEffect, useCallback } from "react";
import { 
  ClipboardText as Assignment, 
  CheckCircle, 
  Clock as PendingIcon, 
  TrendUp, 
  ChartPie, 
  Stack, 
  CaretUp, 
  CaretDown,
  WarningCircle,
  CurrencyDollar
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { adminService } from "@/services/api";
import toastUtil from "@/lib/toast";
import {
  EmptyState,
  PageTransition,
  Skeleton,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DataTable,
  StatCard,
  Card,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import TaskActionMenu from "@/components/admin/TaskActionMenu";
import TaskDetailsModal from "@/components/shared/TaskDetailsModal";
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
          <span className="text-[9px] font-bold uppercase tracking-tight opacity-90 ml-1">
              from last month
          </span>
      </div>
  );
};

import { usePageMeta } from "@/hooks/usePageMeta";

const TaskMonitoring = () => {
  usePageMeta("Task Monitoring", "Monitor and track all platform tasks");
  const [tasks, setTasks] = useState([]);
  const [monitorData, setMonitorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, monitorRes] = await Promise.all([
        adminService.getAllTasks(),
        adminService.getTaskMonitoring()
      ]);
      setTasks(tasksRes.data || []);
      setMonitorData(monitorRes.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toastUtil.handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      task.title?.toLowerCase().includes(query) ||
      task.companyId?.companyName?.toLowerCase().includes(query) ||
      task.companyId?.fullName?.toLowerCase().includes(query) ||
      task.companyId?.email?.toLowerCase().includes(query);

    const currentFilter = ["all", "open", "in-progress", "completed"][activeTab];
    const matchesTab = currentFilter === "all" || task.status === currentFilter;

    return matchesSearch && matchesTab;
  }), [tasks, searchTerm, activeTab]);

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };

  const taskColumns = [
    {
      key: "title",
      label: "Task Title",
      cellClassName: "px-6 py-4 text-sm font-semibold text-foreground",
      render: (task) => task.title || "N/A",
    },
    {
      key: "company",
      label: "Company",
      cellClassName: "px-6 py-4 text-sm text-muted-foreground",
      render: (task) => task.companyId?.companyName || task.companyId?.fullName || task.companyId?.email || "N/A",
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
          <p className="text-sm text-foreground">
            {task.createdAt ? dayjs(task.createdAt).format("MMM DD, YYYY") : "N/A"}
          </p>
          {task.createdAt && (
            <p className="text-xs text-muted-foreground">
              {dayjs(task.createdAt).fromNow()}
            </p>
          )}
        </>
      ),
    },
    {
      key: "deadline",
      label: "Deadline",
      render: (task) => {
        const isOverdue = task.deadline && dayjs(task.deadline).isBefore(dayjs()) && task.status !== "completed";
        return (
          <>
            <p className={cn("text-sm", isOverdue ? "text-danger font-bold" : "text-foreground")}>
              {task.deadline ? dayjs(task.deadline).format("MMM DD, YYYY") : "N/A"}
            </p>
            {isOverdue && (
              <p className="text-[10px] text-danger font-black uppercase tracking-widest">
                Overdue
              </p>
            )}
          </>
        );
      },
    },
    {
      key: "actions",
      label: "",
      headerClassName: "relative px-6 py-3",
      cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
      render: (task) => (
        <TaskActionMenu
          onView={() => handleViewDetails(task)}
        />
      ),
    },
  ];

  const tabOptions = [
    { label: "All Tasks", count: tasks.length },
    { label: "Open", count: tasks.filter(t => t.status === "open").length },
    { label: "In Progress", count: tasks.filter(t => t.status === "in-progress").length },
    { label: "Completed", count: tasks.filter(t => t.status === "completed").length }
  ];

  if (loading && !monitorData) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const { stats: mStats, charts } = monitorData || { stats: {}, charts: {} };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tasks"
            value={mStats.total || 0}
            icon={<Assignment />}
            loading={loading}
            trend={<ChangeIndicator value={mStats.changes?.total} />}
          />
          <StatCard
            title="Active Work"
            value={mStats.active || 0}
            icon={<TrendUp />}
            loading={loading}
          />
          <StatCard
            title="Completed"
            value={mStats.completed || 0}
            icon={<CheckCircle />}
            loading={loading}
          />
          <StatCard
            title="Overdue Tasks"
            value={mStats.overdue || 0}
            icon={<WarningCircle weight="bold" className="text-danger" />}
            loading={loading}
            trend={<ChangeIndicator value={mStats.changes?.overdue} />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Status Distribution (Donut) */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <Card.Header className="pb-2 border-b-0">
                <div className="flex items-center gap-2">
                  <ChartPie className="h-5 w-5 text-info" />
                  <div>
                    <Card.Title className="text-sm uppercase tracking-tight text-foreground">Status Distribution</Card.Title>
                    <Card.Description className="text-xs text-muted-foreground">Tasks by workflow stage</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="h-[300px] flex flex-col justify-center">
                {charts.statusDistribution?.length > 0 ? (
                  <ChartContainer className="h-[240px] w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                        <Pie
                            data={charts.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {charts.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#262626', '#d4d4d4', '#404040'][index % 3]} />
                            ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : <div className="text-center py-10 opacity-50">No data</div>}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {charts.statusDistribution.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#262626', '#d4d4d4', '#404040'][index % 3] }} />
                            <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground">
                                {entry.name}: {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Tasks by Category (Horizontal Bar) */}
          <div className="lg:col-span-8">
            <Card className="h-full">
              <Card.Header className="pb-2 border-b-0">
                <div className="flex items-center gap-2">
                  <Stack className="h-5 w-5 text-warning" />
                  <div>
                    <Card.Title className="text-sm uppercase tracking-tight text-foreground">Tasks by Category</Card.Title>
                    <Card.Description className="text-xs text-muted-foreground">Performance across service sectors</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="h-[300px]">
                <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                    <ResponsiveContainer width="100%" height={260}>
                    <BarChart layout="vertical" data={charts.categoryDistribution} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#e5e5e5', fontSize: 10}} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#e5e5e5', fontSize: 10, fontWeight: 'bold'}} width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#262626" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
              </Card.Content>
            </Card>
          </div>

          {/* Task Creation Over Time (Area Chart) */}
          <div className="lg:col-span-7">
            <Card className="h-full">
              <Card.Header className="pb-2 border-b-0">
                <div className="flex items-center gap-2">
                  <TrendUp className="h-5 w-5 text-success" />
                  <div>
                    <Card.Title className="text-sm uppercase tracking-tight text-foreground">Creation Trends</Card.Title>
                    <Card.Description className="text-xs text-muted-foreground">New tasks posted over time</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="h-[300px]">
                <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                    <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={charts.creationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                        <linearGradient id="colorTasksMonitor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#262626" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#262626" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="tasks" stroke="#262626" fillOpacity={1} fill="url(#colorTasksMonitor)" strokeWidth={2} />
                    </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
              </Card.Content>
            </Card>
          </div>

          {/* Budget Distribution (Bar) */}
          <div className="lg:col-span-5">
            <Card className="h-full">
              <Card.Header className="pb-2 border-b-0">
                <div className="flex items-center gap-2">
                  <CurrencyDollar className="h-5 w-5 text-success" />
                  <div>
                    <Card.Title className="text-sm uppercase tracking-tight text-foreground">Budget Distribution</Card.Title>
                    <Card.Description className="text-xs text-muted-foreground">Volume of tasks by price range</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="h-[300px]">
                <ChartContainer className="h-full w-full mt-4 overflow-hidden">
                    <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={charts.budgetDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tickMargin={10} tick={{fill: '#e5e5e5', fontSize: 10}} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="#404040" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
              </Card.Content>
            </Card>
          </div>
        </div>

        <FilterSearchBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search tasks by title, company, or category..."
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
        />

        {loading ? (
          <div className="space-y-3 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
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
        )}

        <TaskDetailsModal 
            open={viewModalOpen}
            task={selectedTask}
            onX={() => setViewModalOpen(false)}
        />
      </div>
    </PageTransition>
  );
};

export default TaskMonitoring;
