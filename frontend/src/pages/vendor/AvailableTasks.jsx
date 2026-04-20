import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  CurrencyDollar as AttachMoney,
  Calendar as DateRange,
  Buildings as Business,
  Eye as Visibility,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { taskAPI } from "@/services/api";
import { Button, Card, EmptyState, PageTransition, Loader } from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";

const CATEGORY_CLASS_MAP = {
  "web-development": "bg-[var(--foreground)] text-white",
  "mobile-development": "bg-[var(--foreground)]-light text-white",
  "graphic-design": "bg-[var(--foreground)] text-white",
  "digital-marketing": "bg-[var(--muted)] text-[var(--foreground)]",
  "content-writing": "bg-[var(--muted)] text-[var(--foreground)]",
  seo: "bg-[var(--muted)] text-[var(--foreground)]",
  "data-entry": "bg-[var(--muted)] text-[var(--foreground)]",
  other: "bg-[var(--muted)] text-[var(--foreground)]/80",
};

const formatCategoryLabel = (category) =>
  String(category || "Other")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getCategoryClassName = (category) => {
  const normalized = String(category || "other").trim().toLowerCase();
  return CATEGORY_CLASS_MAP[normalized] || "bg-[var(--muted)] text-[var(--foreground)]/80";
};

const TaskCard = ({ task, onView }) => (
  <Card className="overflow-hidden rounded-2xl border-[var(--border)]/80 bg-[var(--card)]/95 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <Card.Content className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryClassName(task.category)}`}>
          {formatCategoryLabel(task.category)}
        </span>
        <StatusChip status={task.status} className="shrink-0" />
      </div>

      <div className="space-y-2">
        <h3 className="line-clamp-2 text-lg font-semibold text-[var(--foreground)]">{task.title || "Untitled task"}</h3>
        <p className="line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {task.description || "No description provided."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <AttachMoney className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="font-medium text-[var(--foreground)]">${task.budget?.toLocaleString() || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <DateRange className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span>{task.deadline ? dayjs(task.deadline).format("MMM DD, YYYY") : "No deadline"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Business className="h-4 w-4 text-[var(--muted-foreground)]" />
        <span className="truncate">{task.companyId?.companyName || "Company"}</span>
      </div>

      <Button
        type="button"
        onClick={() => onView(task._id)}
        icon={<Visibility className="h-4 w-4" />}
        className="w-full"
      >
        View Details
      </Button>
    </Card.Content>
  </Card>
);

const AvailableTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setMagnifyingGlass] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await taskAPI.getVendorTasks();
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = search.toLowerCase();
      const matchesSearch =
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.category?.toLowerCase().includes(query);

      if (tab === 0) return matchesSearch;
      if (tab === 1) return matchesSearch && task.status === "open";
      return matchesSearch;
    });
  }, [tasks, search, tab]);

  const handleViewTask = (taskId) => {
    navigate(`/vendor/task/${taskId}`);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Available Tasks</h1>
          <p className="text-[var(--muted-foreground)]">
            Discover new opportunities that match your skills and delivery capacity.
          </p>
        </div>

        <FilterSearchBar
          searchValue={search}
          onSearchChange={setMagnifyingGlass}
          searchPlaceholder="MagnifyingGlass tasks by title, description, or category..."
          activeTab={tab}
          onTabChange={setTab}
          tabs={["All", "Open"]}
        />

        {loading ? (
          <Loader />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No tasks available"
            description="Check back later for new opportunities or adjust your search and filters."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task._id} task={task} onView={handleViewTask} />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AvailableTasks;
