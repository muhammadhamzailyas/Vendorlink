import React, { useState } from "react";
import { Briefcase, CurrencyDollar, Lightning, ListChecks, Tag } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { taskAPI } from "@/services/api";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import toastUtil from "@/lib/toast";
import { Button, Input, PageTransition, Textarea, Label, DatePicker, ErrorBanner } from "@/components/ui";
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

const AddTask = () => {
  const navigate = useNavigate();
  const { isApproved } = useApprovalStatus();
  const [skillsInput, setSkillsInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      budget: "",
      deadline: null,
      category: "",
      priority: "medium",
      taskType: "fixed-price",
      complexity: "intermediate",
      duration: "1-3-months",
      skills: [],
    },
  });

  const watchAll = watch();
  const isSubmitDisabled = 
    !isApproved || 
    isSubmitting || 
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

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        budget: Number(data.budget),
      };
      await taskAPI.createTask(payload);
      toastUtil.success("Task posted successfully");
      navigate("/company/my-tasks");
    } catch (err) {
      toastUtil.handleApiError(err);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-8 pb-12 pt-4">
        {!isApproved && (
          <div className="rounded-xl bg-warning/10 px-6 py-4 text-sm text-warning font-bold border border-warning/20 flex items-center gap-3">
            <Lightning className="h-5 w-5 shrink-0" weight="fill" />
            Your account is pending approval. You cannot post tasks until verified by an admin.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
          <FormSection
            title="General Information"
            description="Start with a strong title and a clear category for your task."
            icon={<Briefcase className="h-5 w-5" />}
          >
            <FormFieldGrid>
              <div className="md:col-span-2 space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Task Title</Label>
                <Input
                  placeholder="e.g. Modern E-commerce Website Development"
                  disabled={!isApproved}
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
                      disabled={!isApproved}
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
                      disabled={!isApproved}
                    />
                  )}
                />
                <ErrorBanner error={errors.priority?.message} />
              </div>
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="Detailed Brief"
            description="Provide comprehensive details about the project and your expectations."
            icon={<ListChecks className="h-5 w-5" />}
          >
            <div className="space-y-6">
              <div className="space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Project Description</Label>
                <Textarea
                  placeholder="Describe the overall project goals, context, and what you aim to achieve..."
                  rows={6}
                  disabled={!isApproved}
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>

              <div className="space-y-1">
                <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-foreground">Technical Deliverables & Requirements</Label>
                <Textarea
                  placeholder="Define exact artifacts to be handed over (e.g. 'GitHub Source Code', 'Deployed URL', 'Postman Collection', 'Documentation PDF')..."
                  rows={4}
                  disabled={!isApproved}
                  error={errors.requirements?.message}
                  {...register("requirements")}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Skills & Expertise"
            description="What specific skills should the vendor possess?"
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
                        disabled={!isApproved}
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
                        disabled={!isApproved}
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
                      disabled={!isApproved}
                    />
                  )}
                />
                <ErrorBanner error={errors.skills?.message} />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Timeline & Budget"
            description="Define your financial scope and project deadlines."
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
                      disabled={!isApproved}
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
                  disabled={!isApproved}
                  icon={<CurrencyDollar className="h-4 w-4" />}
                  error={errors.budget?.message}
                  {...register("budget")}
                />
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
                      disabled={!isApproved}
                      placeholder="Select deadline date"
                    />
                  )}
                />
                <ErrorBanner error={errors.deadline?.message} />
              </div>
            </FormFieldGrid>
          </FormSection>

          <div className="pt-4">
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitDisabled}
              variant="primary"
              size="lg"
              className="w-full h-14 rounded-xl shadow-soft font-semibold text-base"
            >
              {isSubmitting ? "Publishing..." : "Publish Task"}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default AddTask;
