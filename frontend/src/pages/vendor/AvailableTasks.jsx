import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  CurrencyDollar as AttachMoney,
  Calendar as DateRange,
  Buildings as Business,
  Eye as Visibility,
  Tag,
  Clock,
  ArrowRight,
  User,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { taskAPI } from "@/services/api";
import { 
  Button, 
  EmptyState, 
  PageTransition, 
  Skeleton,
  Badge,
  Card,
  Dialog,
  Combobox,
  Label
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import ProposalForm from "./ProposalForm";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import { cn } from "@/lib/cn";

dayjs.extend(relativeTime);

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "seo", label: "SEO" },
  { value: "data-entry", label: "Data Entry" },
  { value: "other", label: "Other" },
];

const PRICE_RANGES = [
  { value: "all", label: "Any Budget" },
  { value: "under-100", label: "Under $100" },
  { value: "100-500", label: "$100 - $500" },
  { value: "500-1000", label: "$500 - $1,000" },
  { value: "1000-plus", label: "$1,000+" },
];

const DEADLINE_FILTERS = [
  { value: "all", label: "Any Deadline" },
  { value: "urgent", label: "Urgent (Next 3 days)" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "Any Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TaskWidthCard = ({ task, onOpenDetails }) => {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
      <Card.Content className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-black text-[9px] tracking-widest uppercase py-1 px-3">
              {task.category?.replace(/-/g, ' ')}
            </Badge>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1.5">
              <Business size={14} className="opacity-50" />
              {task.companyId?.companyName || "Verified Company"}
            </span>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black tracking-tight text-foreground uppercase group-hover:text-primary transition-colors line-clamp-1">
              {task.title}
            </h3>
            <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed max-w-3xl">
              {task.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center text-foreground/70">
                    <Clock size={16} />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Project Deadline</p>
                    <p className="text-sm font-bold text-foreground">{dayjs(task.deadline).format("MMM DD, YYYY")}</p>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center text-foreground/70">
                    <AttachMoney size={16} />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Task Budget</p>
                    <p className="text-sm font-black text-slate-900">$ {(task.budget || 0).toLocaleString()}</p>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center text-foreground/70">
                    <Tag size={16} />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Priority</p>
                    <p className="text-sm font-bold text-foreground uppercase">{task.priority || "Medium"}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center md:flex-col md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
           <p className="hidden md:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
             Posted {dayjs(task.createdAt).fromNow()}
           </p>
           <Button 
             onClick={() => onOpenDetails(task)}
             className="w-full md:w-44 font-black uppercase tracking-widest text-[10px] h-12 shadow-sm"
           >
             View Specifications
           </Button>
        </div>
      </Card.Content>
    </Card>
  );
};

const TaskDetailsDialog = ({ open, task, onX, onApply }) => {
  if (!task) return null;
  const { isApproved } = useApprovalStatus();

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-4xl">
        <Dialog.Header className="border-b-0 px-8 pt-10 pb-6">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-2xl bg-muted/50 text-foreground">
                    <Briefcase size={40} weight="bold" />
                </div>
                <div className="space-y-2">
                    <Dialog.Title className="text-2xl font-black tracking-tighter text-foreground uppercase leading-tight">
                        {task.title}
                    </Dialog.Title>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border-border/60">
                            {task.category?.replace(/-/g, ' ')}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-foreground text-background">
                            Budget: ${(task.budget || 0).toLocaleString()}
                        </Badge>
                    </div>
                </div>
            </div>
        </Dialog.Header>

        <Dialog.Body className="px-8 pb-10 max-h-[60vh] overflow-y-auto space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Client</p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        <User size={16} /> {task.companyId?.companyName || "Verified Client"}
                    </p>
                </div>
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Deadline</p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        <DateRange size={16} /> {dayjs(task.deadline).format("MMM DD, YYYY")}
                    </p>
                </div>
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Priority</p>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2 uppercase">
                        <Tag size={16} /> {task.priority || "Medium"}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                    <div className="h-1.5 w-6 rounded-full bg-primary" />
                    Description
                </h4>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 bg-card p-6 rounded-2xl border border-border/50 whitespace-pre-wrap">
                    {task.description}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                    <div className="h-1.5 w-6 rounded-full bg-primary" />
                    Requirements
                </h4>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 bg-card p-6 rounded-2xl border border-border/50 whitespace-pre-wrap">
                    {task.requirements || "No specific requirements provided."}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                    <div className="h-1.5 w-6 rounded-full bg-primary" />
                    Skills Needed
                </h4>
                <div className="flex flex-wrap gap-2">
                    {task.skills?.length > 0 ? (
                        task.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary" className="font-black text-[10px] py-1.5 px-4 rounded-lg uppercase tracking-widest bg-foreground text-background border-none">
                                {skill}
                            </Badge>
                        ))
                    ) : (
                        <p className="text-xs text-muted-foreground italic">No specific skills listed.</p>
                    )}
                </div>
            </div>
        </Dialog.Body>

        <div className="flex items-center justify-center gap-4 px-8 py-8 border-t border-border/50 bg-muted/20">
            <Button
                variant="ghost"
                onClick={onX}
                className="font-black uppercase tracking-widest text-[10px] h-12 px-8"
            >
                Close
            </Button>
            <Button
                onClick={() => onApply(task)}
                disabled={!isApproved}
                className="font-black uppercase tracking-widest text-[10px] h-12 px-12 shadow-lg"
            >
                Submit Proposal Now
            </Button>
        </div>
    </Dialog>
  );
};

const AvailableTasks = () => {
  const navigate = useNavigate();
  const { isApproved } = useApprovalStatus();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setMagnifyingGlass] = useState("");

  // Advanced filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getVendorTasks();
      const taskList = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = search.toLowerCase();
      const matchesSearch =
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query);

      const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      
      let matchesPrice = true;
      if (priceFilter === "under-100") matchesPrice = task.budget < 100;
      else if (priceFilter === "100-500") matchesPrice = task.budget >= 100 && task.budget <= 500;
      else if (priceFilter === "500-1000") matchesPrice = task.budget > 500 && task.budget <= 1000;
      else if (priceFilter === "1000-plus") matchesPrice = task.budget > 1000;

      let matchesDeadline = true;
      if (deadlineFilter === "urgent") {
          const diff = dayjs(task.deadline).diff(dayjs(), 'day');
          matchesDeadline = diff >= 0 && diff <= 3;
      } else if (deadlineFilter === "this-week") {
          const diff = dayjs(task.deadline).diff(dayjs(), 'day');
          matchesDeadline = diff >= 0 && diff <= 7;
      } else if (deadlineFilter === "this-month") {
          const diff = dayjs(task.deadline).diff(dayjs(), 'day');
          matchesDeadline = diff >= 0 && diff <= 30;
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesDeadline && matchesPriority;
    });
  }, [tasks, search, categoryFilter, priceFilter, deadlineFilter, priorityFilter]);

  const handleOpenDetails = (task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  const handleOpenProposal = (task) => {
    setSelectedTask(task);
    setDetailsOpen(false);
    setProposalOpen(true);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <FilterSearchBar
          searchValue={search}
          onSearchChange={setMagnifyingGlass}
          searchPlaceholder="search by task name"
          className="mb-0"
          filters={(
            <>
              <Combobox 
                options={CATEGORIES} 
                value={categoryFilter} 
                onSelect={(val) => setCategoryFilter(val || "all")}
                placeholder="All Categories"
                className="h-9 rounded-lg"
              />
              <Combobox 
                options={PRICE_RANGES} 
                value={priceFilter} 
                onSelect={(val) => setPriceFilter(val || "all")} 
                placeholder="Any Budget"
                className="h-9 rounded-lg"
              />
              <Combobox 
                options={DEADLINE_FILTERS} 
                value={deadlineFilter} 
                onSelect={(val) => setDeadlineFilter(val || "all")} 
                placeholder="Any Deadline"
                className="h-9 rounded-lg"
              />
              <Combobox 
                options={PRIORITY_OPTIONS} 
                value={priorityFilter} 
                onSelect={(val) => setPriorityFilter(val || "all")} 
                placeholder="Any Priority"
                className="h-9 rounded-lg"
              />
            </>
          )}
        />

        {loading ? (
          <div className="space-y-6 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No matches found"
            description="Try adjusting your search criteria or explore other categories."
            className="border-0 bg-transparent py-20"
          />
        ) : (
          <div className="space-y-4 pt-4">
            <div className="flex flex-col gap-6">
                {filteredTasks.map((task) => (
                    <TaskWidthCard 
                        key={task._id} 
                        task={task} 
                        onOpenDetails={handleOpenDetails} 
                    />
                ))}
            </div>
          </div>
        )}

        <TaskDetailsDialog
            open={detailsOpen}
            task={selectedTask}
            onX={() => setDetailsOpen(false)}
            onApply={handleOpenProposal}
        />

        <ProposalForm
            open={proposalOpen}
            taskId={selectedTask?._id}
            companyId={selectedTask?.companyId?._id || selectedTask?.companyId}
            onX={() => setProposalOpen(false)}
            onProposalSubmitted={() => {
                setProposalOpen(false);
                fetchTasks(); // Refresh list
            }}
        />
      </div>
    </PageTransition>
  );
};

export default AvailableTasks;
