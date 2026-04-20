import React, { useState, useEffect } from "react";
import {
  Eye as Visibility,
  ClipboardText as Assignment,
  CheckCircle as CheckCircle,
  Clock as Pending,
  Check as Done,
  Plus,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { taskAPI } from "@/services/api";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import { Button, EmptyState, PageTransition, Skeleton, StatCard, DataTable, Loader } from "@/components/ui";

const MyTaskPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setMagnifyingGlass] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await taskAPI.getCompanyTasks();
      setTasks(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    if (tab === 0) return matchesSearch;
    if (tab === 1) return matchesSearch && task.status === "open";
    if (tab === 2) return matchesSearch && task.status === "in-progress";
    return matchesSearch && task.status === "completed";
  });

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const taskColumns = [
    {
      key: "title",
      label: "Task Title",
      render: (task) => (
        <>
          <p className="text-sm font-semibold text-[var(--foreground)]">{task.title}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{task.description || "No description"}</p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (task) => <StatusChip status={task.status || "open"} />,
    },
    {
      key: "created",
      label: "Created",
      render: (task) => dayjs(task.createdAt).format("MMM DD, YYYY"),
    },
    {
      key: "deadline",
      label: "Deadline",
      render: (task) => (task.deadline ? dayjs(task.deadline).format("MMM DD, YYYY") : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (task) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => navigate(`/company/task/${task._id}`)}
        >
          <Visibility className="mr-2 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage active postings, review delivery timelines, and inspect task progress.</p>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Tasks" value={stats.total} icon={<Assignment />} link="/company/my-tasks" />
              <StatCard title="Open" value={stats.open} icon={<Pending />} />
              <StatCard title="In Progress" value={stats.inProgress} icon={<CheckCircle />} />
              <StatCard title="Completed" value={stats.completed} icon={<Done />} />
            </div>

            <FilterSearchBar
              searchValue={search}
              onSearchChange={setMagnifyingGlass}
              searchPlaceholder="MagnifyingGlass tasks..."
              activeTab={tab}
              onTabChange={setTab}
              tabs={["All", "Open", "In Progress", "Completed"]}
              actions={(
                <Button
                  variant="secondary"
                  onClick={() => navigate("/company/add-task")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              )}
            />

            <DataTable
              columns={taskColumns}
              data={filteredTasks}
              rowKey="_id"
              showSectionHeader
              icon={<Assignment className="h-5 w-5" />}
              title="Task List"
              subtitle="All company task postings and their current workflow status"
              emptyState={
                <EmptyState
                  icon={Assignment}
                  title="No tasks found"
                  description={search ? "Try adjusting your search criteria" : "Create your first task to get started"}
                  className="border-0 bg-transparent py-2"
                />
              }
            />
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default MyTaskPage;
