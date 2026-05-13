import React, { useEffect, useState } from "react";
import { 
  PencilSimple as Edit, 
  FloppyDisk,
  Briefcase,
  ListChecks,
  Tag,
  CurrencyDollar,
  Warning
} from "@phosphor-icons/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { taskAPI } from "@/services/api";
import toastUtil from "@/lib/toast";
import { 
  Dialog, 
  Button, 
  Input, 
  Textarea, 
  Label,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  DatePicker
} from "@/components/ui";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
import SearchableSelect from "@/components/auth/signup/SearchableSelect";
import SkillsTagInput from "@/components/auth/signup/SkillsTagInput";

const CATEGORIES = [
  { value: "3d-modeling-rendering", label: "3D Modeling & Rendering" },
  { value: "ai-ml", label: "AI & Machine Learning" },
  { value: "android-development", label: "Android Development" },
  { value: "architecture-interior", label: "Architecture & Interior Design" },
  { value: "backend-development", label: "Backend Development" },
  { value: "big-data", label: "Big Data Solutions" },
  { value: "blockchain-crypto", label: "Blockchain & Cryptocurrency" },
  { value: "business-consulting", label: "Business Consulting" },
  { value: "cad-engineering", label: "CAD & Engineering" },
  { value: "computer-vision", label: "Computer Vision" },
  { value: "content-marketing", label: "Content Marketing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "copywriting", label: "Copywriting" },
  { value: "customer-support", label: "Customer & Tech Support" },
  { value: "cybersecurity-audit", label: "Cybersecurity & Security Audit" },
  { value: "data-engineering", label: "Data Engineering" },
  { value: "data-entry", label: "Data Entry" },
  { value: "data-science-analytics", label: "Data Science & Analytics" },
  { value: "desktop-apps", label: "Desktop Software Development" },
  { value: "devops-cloud", label: "DevOps & Cloud Computing" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "ecommerce-development", label: "E-commerce Development" },
  { value: "editing-proofreading", label: "Editing & Proofreading" },
  { value: "email-marketing", label: "Email Marketing" },
  { value: "financial-accounting", label: "Financial & Accounting" },
  { value: "frontend-development", label: "Frontend Development" },
  { value: "fullstack-development", label: "Full-Stack Development" },
  { value: "game-development", label: "Game Development" },
  { value: "ghostwriting", label: "Ghostwriting" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "hr-recruitment", label: "HR & Recruitment" },
  { value: "illustration", label: "Illustration" },
  { value: "ios-development", label: "iOS Development" },
  { value: "it-support-troubleshooting", label: "IT Support & Troubleshooting" },
  { value: "lead-generation", label: "Lead Generation" },
  { value: "legal-services", label: "Legal Services" },
  { value: "logo-branding", label: "Logo & Branding" },
  { value: "market-research", label: "Market Research" },
  { value: "mobile-development", label: "Mobile App Development" },
  { value: "motion-graphics", label: "Motion Graphics & Animation" },
  { value: "network-administration", label: "Network Administration" },
  { value: "nlp-chatbots", label: "NLP & Chatbots" },
  { value: "other", label: "Other / General" },
  { value: "product-design", label: "Product Design" },
  { value: "project-management", label: "Project Management" },
  { value: "seo-sem", label: "SEO & SEM" },
  { value: "social-media-marketing", label: "Social Media Marketing" },
  { value: "technical-writing", label: "Technical Writing" },
  { value: "translation-localization", label: "Translation & Localization" },
  { value: "ui-ux-design", label: "UI/UX Design" },
  { value: "video-editing", label: "Video Editing" },
  { value: "virtual-assistant", label: "Virtual Assistant" },
  { value: "web-development", label: "Web Development" },
];

const PRIORITIES = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent Priority" },
];

const TASK_TYPES = [
  { value: "fixed-price", label: "Fixed Price" },
  { value: "hourly", label: "Hourly Rate" },
  { value: "milestone-based", label: "Milestone Based" },
];

const COMPLEXITY_LEVELS = [
  { value: "beginner", label: "Beginner - Simple tasks" },
  { value: "intermediate", label: "Intermediate - Specialized skills" },
  { value: "expert", label: "Expert - High-level expertise" },
];

const DURATIONS = [
  { value: "less-than-1-week", label: "Less than 1 week" },
  { value: "1-2-weeks", label: "1 to 2 weeks" },
  { value: "2-4-weeks", label: "2 to 4 weeks" },
  { value: "1-month", label: "1 month" },
  { value: "1-3-months", label: "1 to 3 months" },
  { value: "3-6-months", label: "3 to 6 months" },
  { value: "6-months-1-year", label: "6 months to 1 year" },
  { value: "more-than-1-year", label: "More than 1 year" },
];

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().min(30, "Requirements must be at least 30 characters"),
  budget: z.coerce.number().positive("Enter a valid budget"),
  deadline: z.any().refine(val => !!val, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  taskType: z.string().min(1, "Task type is required"),
  complexity: z.string().min(1, "Complexity is required"),
  duration: z.string().min(1, "Duration is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

const ErrorMsg = ({ children }) => (
  <div className="mt-2 flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-[11px] font-bold tracking-tight text-error animate-in fade-in slide-in-from-top-1 border border-error/20">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,16,0v40A8,8,0,0,1,144,176ZM128,80a12,12,0,1,1-12,12A12,12,0,0,1,128,80Z"></path>
    </svg>
    <span className="leading-none">{children}</span>
  </div>
);

const TaskEditModal = ({ open, task, onX, onSuccess }) => {
  const [skillsInput, setSkillsInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (task && open) {
      reset({
        title: task.title,
        description: task.description,
        requirements: task.requirements,
        budget: task.budget,
        deadline: task.deadline ? new Date(task.deadline) : null,
        category: task.category,
        priority: task.priority || "medium",
        taskType: task.taskType || "fixed-price",
        complexity: task.complexity || "intermediate",
        duration: task.duration || "1-3-months",
        skills: task.skills?.length > 0 ? task.skills : [],
      });
    }
  }, [task, open, reset]);

  const watchAll = watch();
  const isSaveDisabled = 
    !isDirty || 
    task?.status !== "open" ||
    !watchAll.title?.trim() || 
    !watchAll.description?.trim() || 
    !watchAll.requirements?.trim() || 
    !watchAll.budget || 
    !watchAll.deadline || 
    !watchAll.category || 
    !watchAll.priority || 
    !watchAll.taskType || 
    !watchAll.complexity || 
    !watchAll.duration || 
    watchAll.skills.length === 0;

  const onSubmit = (data) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      const payload = {
        ...pendingData,
        budget: Number(pendingData.budget),
      };
      await taskAPI.updateTask(task._id, payload);
      toastUtil.success("Task updated successfully");
      onSuccess();
      onX();
    } catch (err) {
      toastUtil.handleApiError(err);
    } finally {
      setConfirmOpen(false);
    }
  };

  if (!open) return null;

  const isTaskOpen = task?.status === "open";

  return (
    <>
      <Dialog open={open} onX={onX} className="sm:max-w-3xl">
        <Dialog.Header onX={onX} className="border-b-0 px-8 pt-10 pb-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 rounded-full bg-muted/50 text-foreground">
              <Edit size={32} weight="bold" />
            </div>
            <div className="space-y-1.5">
              <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
                Edit Task Details
              </Dialog.Title>
              <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Modify your project requirements and budget
              </Dialog.Description>
            </div>
            {!isTaskOpen && (
              <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 rounded-lg text-error text-[10px] font-bold uppercase tracking-widest">
                <Warning size={14} />
                Only open tasks can be edited
              </div>
            )}
          </div>
        </Dialog.Header>

        <Dialog.Body className="px-8 pb-8 max-h-[70vh] overflow-y-auto">
          <form id="edit-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            <FormSection
              title="General Information"
              icon={<Briefcase className="h-4 w-4" />}
            >
              <FormFieldGrid>
                <div className="md:col-span-2 space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Task Title</Label>
                  <Input
                    placeholder="e.g. Modern E-commerce Website Development"
                    disabled={!isTaskOpen}
                    {...register("title")}
                  />
                  {errors.title && <ErrorMsg>{errors.title.message}</ErrorMsg>}
                </div>
                
                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Category</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={CATEGORIES}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select category"
                        searchPlaceholder="Search categories..."
                        disabled={!isTaskOpen}
                      />
                    )}
                  />
                  {errors.category && <ErrorMsg>{errors.category.message}</ErrorMsg>}
                </div>

                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Priority Level</Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={PRIORITIES}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select priority"
                        searchPlaceholder="Search priorities..."
                        disabled={!isTaskOpen}
                      />
                    )}
                  />
                  {errors.priority && <ErrorMsg>{errors.priority.message}</ErrorMsg>}
                </div>
              </FormFieldGrid>
            </FormSection>

            <FormSection
              title="Detailed Brief"
              icon={<ListChecks className="h-4 w-4" />}
            >
              <div className="space-y-6">
                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Project Description</Label>
                  <Textarea
                    placeholder="Describe the overall project goals..."
                    rows={4}
                    disabled={!isTaskOpen}
                    {...register("description")}
                  />
                  {errors.description && <ErrorMsg>{errors.description.message}</ErrorMsg>}
                </div>

                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Technical Deliverables & Requirements</Label>
                  <Textarea
                    placeholder="Define exact artifacts to be handed over (e.g. 'GitHub Source Code', 'Deployed URL')..."
                    rows={3}
                    disabled={!isTaskOpen}
                    {...register("requirements")}
                  />
                  {errors.requirements && <ErrorMsg>{errors.requirements.message}</ErrorMsg>}
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Skills & Expertise"
              icon={<Tag className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Complexity Level</Label>
                    <Controller
                      name="complexity"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={COMPLEXITY_LEVELS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select complexity"
                          searchPlaceholder="Search complexity levels..."
                          disabled={!isTaskOpen}
                        />
                      )}
                    />
                    {errors.complexity && <ErrorMsg>{errors.complexity.message}</ErrorMsg>}
                  </div>

                  <div className="space-y-1">
                    <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Expected Duration</Label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={DURATIONS}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select duration"
                          searchPlaceholder="Search project durations..."
                          disabled={!isTaskOpen}
                        />
                      )}
                    />
                    {errors.duration && <ErrorMsg>{errors.duration.message}</ErrorMsg>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => (
                      <SkillsTagInput
                        skills={field.value}
                        skillsInput={skillsInput}
                        onChange={setSkillsInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            const val = (e.overrideValue || skillsInput).trim();
                            if (val && !field.value.some(s => s.toLowerCase() === val.toLowerCase())) {
                              field.onChange([...field.value, val]);
                              setSkillsInput("");
                            }
                          }
                        }}
                        onRemove={(skill) => field.onChange(field.value.filter((s) => s !== skill))}
                        disabled={!isTaskOpen}
                      />
                    )}
                  />
                  {errors.skills && <ErrorMsg>{errors.skills.message}</ErrorMsg>}
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Timeline & Budget"
              icon={<CurrencyDollar className="h-4 w-4" />}
            >
              <FormFieldGrid className="sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Payment Type</Label>
                  <Controller
                    name="taskType"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={TASK_TYPES}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select type"
                        searchPlaceholder="Search payment types..."
                        disabled={!isTaskOpen}
                      />
                    )}
                  />
                  {errors.taskType && <ErrorMsg>{errors.taskType.message}</ErrorMsg>}
                </div>

                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Budget (USD)</Label>
                  <Input
                    type="number"
                    numericOnly
                    icon={<CurrencyDollar className="h-4 w-4" />}
                    disabled={!isTaskOpen}
                    {...register("budget")}
                  />
                  {errors.budget && <ErrorMsg>{errors.budget.message}</ErrorMsg>}
                </div>

                <div className="space-y-1">
                  <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Submission Deadline</Label>
                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!isTaskOpen}
                        placeholder="Select deadline date"
                      />
                    )}
                  />
                  {errors.deadline && <ErrorMsg>{errors.deadline.message}</ErrorMsg>}
                </div>
              </FormFieldGrid>
            </FormSection>
          </form>
        </Dialog.Body>

        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border/50 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              onClick={onX}
              className="font-normal uppercase tracking-widest text-xs h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-task-form"
              loading={isSubmitting}
              disabled={isSaveDisabled}
              className="font-normal uppercase tracking-widest text-xs h-11 px-8 rounded-xl shadow-soft"
            >
              <FloppyDisk className="mr-2 h-4 w-4" weight="bold" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Confirm Updates</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
              Are you sure you want to save these changes? This will update the task details visible to all potential vendors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Yes, Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskEditModal;
