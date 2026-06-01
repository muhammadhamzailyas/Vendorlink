import React, { useState, useEffect } from "react";
import {
  Eye as Visibility,
  ClipboardText,
  ClipboardText as Assignment,
  CheckCircle as CheckCircle,
  Clock as Pending,
  Check as Done,
  Plus,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  CaretUp,
  CaretDown,
  TrendUp,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { taskAPI } from "@/services/api";

dayjs.extend(relativeTime);
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import { 
  Button, 
  EmptyState, 
  PageTransition, 
  StatCard, 
  DataTable, 
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import toastUtil from "@/lib/toast";
import TaskDetailsModal from "@/components/shared/TaskDetailsModal";
import TaskEditModal from "./TaskEditModal";

const MyTaskPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Deletion alert states
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletabilityInfo, setDeletabilityInfo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenDeleteDialog = async (task) => {
    try {
      setSelectedTask(task);
      const res = await taskAPI.checkDeletability(task._id);
      setDeletabilityInfo(res.data);
      setDeleteAlertOpen(true);
    } catch (error) {
      toastUtil.handleApiError(error);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTask || !deletabilityInfo?.canDelete) return;
    setIsDeleting(true);
    try {
      await taskAPI.deleteTask(selectedTask._id);
      toastUtil.success("Task deleted successfully");
      setTasks(prev => prev.filter(t => t._id !== selectedTask._id));
      setDeleteAlertOpen(false);
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    if (tab === 0) return matchesSearch;
    if (tab === 1) return matchesSearch && (task.status === "open");
    if (tab === 2) return matchesSearch && (task.status === "in-progress");
    if (tab === 3) return matchesSearch && (task.status === "completed");
    return matchesSearch;
  });

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
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
                vs last month
            </span>
        </div>
    );
  };

  const taskColumns = [
    {
      key: "title",
      label: "Task Title",
      render: (task) => (
        <>
          <p className="text-sm font-semibold text-foreground">{task.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.category || "General"}</p>
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
      render: (task) => (
          <div>
            <p className="text-sm text-foreground">{dayjs(task.createdAt).format("MMM DD, YYYY")}</p>
            <p className="text-xs text-muted-foreground">{dayjs(task.createdAt).fromNow()}</p>
          </div>
      ),
    },
    {
      key: "budget",
      label: "Budget",
      render: (task) => (
        <p className="text-sm font-bold text-foreground">
            ${(task.budget || 0).toLocaleString()}
        </p>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      cellClassName: "px-6 py-4 text-right",
      render: (task) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <DotsThreeVertical size={20} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => {
              setSelectedTask(task);
              setDetailsModalOpen(true);
            }}>
              <Visibility className="mr-2 h-4 w-4" />
              Show Details
            </DropdownMenuItem>
            {task.contractStatus === "pending-completion" && (
                <DropdownMenuItem 
                    onClick={() => navigate(`/company/task/${task._id}/progress`)}
                    className="text-warning focus:text-warning font-bold"
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Review Completion
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate(`/company/proposals?taskId=${task._id}`)}>
              <ClipboardText className="mr-2 h-4 w-4" />
              View Proposals
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedTask(task);
              setEditModalOpen(true);
            }}>
              <PencilSimple className="mr-2 h-4 w-4" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                onClick={() => handleOpenDeleteDialog(task)}
                className="text-error focus:text-error"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const tabOptions = [
    { label: "All", count: tasks.length },
    { label: "Open", count: tasks.filter(t => t.status === "open").length },
    { label: "In Progress", count: tasks.filter(t => t.status === "in-progress").length },
    { label: "Completed", count: tasks.filter(t => t.status === "completed").length },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Tasks" 
                value={stats.total} 
                icon={<Assignment />} 
                trend={<ChangeIndicator value={8.4} />}
              />
              <StatCard 
                title="Open Tasks" 
                value={stats.open} 
                icon={<Pending />} 
                trend={<ChangeIndicator value={2.1} />}
              />
              <StatCard 
                title="In Progress" 
                value={stats.inProgress} 
                icon={<CheckCircle />} 
                trend={<ChangeIndicator value={0} />}
              />
              <StatCard 
                title="Completed" 
                value={stats.completed} 
                icon={<TrendUp />} 
                trend={<ChangeIndicator value={12.5} />}
              />
            </div>

            <FilterSearchBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search tasks by title, category, or status..."
              activeTab={tab}
              onTabChange={setTab}
              tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
              actions={(
                <Button
                  variant="secondary"
                  onClick={() => navigate("/company/add-task")}
                >
                  
                  Create Task
                </Button>
              )}
            />

            <DataTable
              columns={taskColumns}
              data={filteredTasks}
              rowKey="_id"
              showSectionHeader={false}
              showTableHeader={true}
              emptyState={
                <EmptyState
                  icon={Assignment}
                  title="No tasks found"
                  description={search ? "Try adjusting your search criteria" : "Create your first task to get started"}
                  className="border-0 bg-transparent py-2"
                />
              }
            />

            <TaskDetailsModal
              open={detailsModalOpen}
              task={selectedTask}
              onX={() => setDetailsModalOpen(false)}
            />

            <TaskEditModal
              open={editModalOpen}
              task={selectedTask}
              onX={() => setEditModalOpen(false)}
              onSuccess={loadTasks}
            />

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {deletabilityInfo?.message || "Delete Task"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {deletabilityInfo?.warning || "Are you sure you want to delete this task? This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    {deletabilityInfo?.canDelete ? "Cancel" : "Close"}
                  </AlertDialogCancel>
                  {deletabilityInfo?.canDelete && (
                    <Button
                      variant={deletabilityInfo?.level === 2 ? "destructive" : "default"}
                      onClick={confirmDelete}
                      loading={isDeleting}
                      className="font-semibold uppercase tracking-tight text-[11px]"
                    >
                      Yes, Delete
                    </Button>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default MyTaskPage;

