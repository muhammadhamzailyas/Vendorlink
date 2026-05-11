import React, { useState } from "react";
import { Plus as PlusIcon, Tag, Briefcase, Calendar, CurrencyDollar, Lightning, ListChecks } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { taskAPI } from "@/services/api";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import toastUtil from "@/lib/toast";
import { Button, Input, PageTransition, Select, Textarea, Label } from "@/components/ui";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import DynamicListField from "@/components/shared/DynamicListField";

const CATEGORIES = [
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "seo", label: "SEO" },
  { value: "data-entry", label: "Data Entry" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TASK_TYPES = [
  { value: "fixed-price", label: "Fixed Price" },
  { value: "hourly", label: "Hourly Rate" },
  { value: "milestone-based", label: "Milestone Based" },
];

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(50, "Description must be at least 50 characters to provide enough context for vendors"),
  requirements: z.string().min(30, "Requirements must be at least 30 characters"),
  budget: z.coerce.number().positive("Enter a valid budget greater than zero"),
  deadline: z.string().min(1, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().default("medium"),
  taskType: z.string().default("fixed-price"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

const AddTask = () => {
  const navigate = useNavigate();
  const { isApproved } = useApprovalStatus();
  const [skills, setSkills] = useState([""]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      budget: "",
      deadline: "",
      category: "",
      priority: "medium",
      taskType: "fixed-price",
      skills: [""],
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        budget: Number(data.budget),
        skills: data.skills.filter(s => s.trim() !== ""),
      };
      await taskAPI.createTask(payload);
      toastUtil.success("Task posted successfully");
      navigate("/company/my-tasks");
    } catch (err) {
      toastUtil.handleApiError(err);
    }
  };

  const handleAddSkill = () => {
    const newSkills = [...skills, ""];
    setSkills(newSkills);
    setValue("skills", newSkills);
  };

  const handleRemoveSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
    setValue("skills", newSkills);
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
    setValue("skills", newSkills);
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-8 pb-12 pt-4">
        

        {!isApproved && (
          <div className="rounded-2xl bg-warning/10 px-6 py-4 text-sm text-warning font-bold border border-warning/20 flex items-center gap-3">
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
              <Input
                label="Task Title"
                placeholder="e.g. Modern E-commerce Website Development"
                disabled={!isApproved}
                error={errors.title?.message}
                className="md:col-span-2"
                {...register("title")}
              />
              
              <Select
                label="Category"
                placeholder="Select a category"
                options={CATEGORIES}
                disabled={!isApproved}
                error={errors.category?.message}
                {...register("category")}
              />

              <Select
                label="Priority Level"
                options={PRIORITIES}
                disabled={!isApproved}
                error={errors.priority?.message}
                {...register("priority")}
              />
            </FormFieldGrid>
          </FormSection>

          <FormSection
            title="Detailed Brief"
            description="Provide comprehensive details about the project and your expectations."
            icon={<ListChecks className="h-5 w-5" />}
          >
            <div className="space-y-6">
              <Textarea
                label="Project Description"
                placeholder="Describe the overall project goals, context, and what you aim to achieve..."
                rows={6}
                disabled={!isApproved}
                error={errors.description?.message}
                {...register("description")}
              />

              <Textarea
                label="Technical Requirements & Deliverables"
                placeholder="List specific technical requirements, tools, features, and final deliverables expected..."
                rows={4}
                disabled={!isApproved}
                error={errors.requirements?.message}
                {...register("requirements")}
              />
            </div>
          </FormSection>

          <FormSection
            title="Skills & Expertise"
            description="What specific skills should the vendor possess?"
            icon={<Tag className="h-5 w-5" />}
          >
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <DynamicListField
                  label="Required Skills"
                  items={skills}
                  onAdd={handleAddSkill}
                  onRemove={handleRemoveSkill}
                  onChange={handleSkillChange}
                  placeholder="e.g. React.js"
                  addLabel="Add Skill"
                  disabled={!isApproved}
                  error={errors.skills?.message}
                  helperText="Press the button below to add more specific skills."
                />
              )}
            />
          </FormSection>

          <FormSection
            title="Timeline & Budget"
            description="Define your financial scope and project deadlines."
            icon={<CurrencyDollar className="h-5 w-5" />}
            footer={(
              <FormActionRow>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!isApproved}
                  size="lg"
                  className="w-full sm:w-auto font-black uppercase tracking-widest px-10"
                >
                  <PlusIcon className="h-5 w-5 mr-2" weight="bold" />
                  Publish Task
                </Button>
              </FormActionRow>
            )}
          >
            <FormFieldGrid className="sm:grid-cols-3">
              <Select
                label="Payment Type"
                options={TASK_TYPES}
                disabled={!isApproved}
                error={errors.taskType?.message}
                {...register("taskType")}
              />

              <Input
                label="Budget (USD)"
                type="number"
                placeholder="e.g. 500"
                disabled={!isApproved}
                error={errors.budget?.message}
                icon={<CurrencyDollar className="h-4 w-4" />}
                {...register("budget")}
              />

              <Input
                label="Deadline"
                type="date"
                disabled={!isApproved}
                error={errors.deadline?.message}
                icon={<Calendar className="h-4 w-4" />}
                {...register("deadline")}
              />
            </FormFieldGrid>
          </FormSection>
        </form>
      </div>
    </PageTransition>
  );
};

export default AddTask;
