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
  DatePicker, 
  Badge, 
  StatCard, 
  EmptyState, 
  Select, 
  StatCard as CategoryCard,
  ErrorBanner
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
  budget: z.coerce.number().positive("Enter a valid budget greater than zero"),
  deadline: z.any().refine(val => !!val, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  taskType: z.string().min(1, "Task type is required"),
  complexity: z.string().min(1, "Complexity is required"),
  duration: z.string().min(1, "Duration is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

const TaskEditModal = ({ open, task, onX, onSuccess }) => {
  const [skillsInput, setSkillsInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title || "",
        description: task.description || "",
        requirements: task.requirements || "",
        budget: task.budget || "",
        deadline: task.deadline ? new Date(task.deadline) : null,
        category: task.category || "",
        priority: task.priority || "medium",
        taskType: task.taskType || "fixed-price",
        complexity: task.complexity || "intermediate",
        duration: task.duration || "1-3-months",
        skills: task.skills || [],
      });
    }
  }, [task, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        budget: Number(data.budget),
      };
      await taskAPI.updateTask(task._id, payload);
      toastUtil.success("Task updated successfully");
      onSuccess?.();
      onX();
    } catch (err) {
      toastUtil.handleApiError(err);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-5xl">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-muted/50 text-foreground">
            <Edit size={32} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
              Update Specifications
            </Dialog.Title>
            <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Modify the task requirements and project scope
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <FormSection
            title="General Information"
            icon={<Briefcase className="h-5 w-5" />}
          >
            <FormFieldGrid>
              <div className="md:col-span-2 space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Task Title</Label>
                <Input
                  placeholder="e.g. Modern E-commerce Website Development"
                  error={errors.title?.message}
                  {...register("title")}
                />
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
                    />
                  )}
                />
                <ErrorBanner error={errors.category?.message} />
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
                    />
                  )}
                />
                <ErrorBanner error={errors.priority?.message} />
              </div>
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="Detailed Brief"
            icon={<ListChecks className="h-5 w-5" />}
          >
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Project Description</Label>
                <Textarea
                  placeholder="Describe the overall project goals..."
                  rows={6}
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>

              <div className="space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Technical Deliverables</Label>
                <Textarea
                  placeholder="Define exact artifacts to be handed over..."
                  rows={4}
                  error={errors.requirements?.message}
                  {...register("requirements")}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Skills & Expertise"
            icon={<Tag className="h-5 w-5" />}
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
                      />
                    )}
                  />
                  <ErrorBanner error={errors.complexity?.message} />
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
                      />
                    )}
                  />
                  <ErrorBanner error={errors.duration?.message} />
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
                    />
                  )}
                />
                <ErrorBanner error={errors.skills?.message} />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Timeline & Budget"
            icon={<CurrencyDollar className="h-5 w-5" />}
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
                    />
                  )}
                />
                <ErrorBanner error={errors.taskType?.message} />
              </div>

              <div className="space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Budget (USD)</Label>
                <Input
                  type="number"
                  numericOnly
                  placeholder="e.g. 500"
                  icon={<CurrencyDollar className="h-4 w-4" />}
                  error={errors.budget?.message}
                  {...register("budget")}
                />
              </div>

              <div className="space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Deadline</Label>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select date"
                    />
                  )}
                />
                <ErrorBanner error={errors.deadline?.message} />
              </div>
            </FormFieldGrid>
          </FormSection>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onX}
              className="flex-1 font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="flex-[2] h-12 rounded-xl shadow-lg font-black uppercase tracking-widest text-[10px]"
            >
              Save Specifications
            </Button>
          </div>
        </form>
      </Dialog.Body>
    </Dialog>
  );
};

export default TaskEditModal;
