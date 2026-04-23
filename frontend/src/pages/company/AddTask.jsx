import React from "react";
import { Plus as PlusIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { taskAPI } from "@/services/api";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import ApprovalStatusBanner from "@/components/ApprovalStatusBanner";
import toastUtil from "@/lib/toast";
import { Button, Input, PageTransition, Select, Textarea } from "@/components/ui";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";

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

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().min(1, "Requirements are required"),
  budget: z.coerce.number().positive("Enter a valid budget greater than zero"),
  deadline: z.string().min(1, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
});

const AddTask = () => {
  const navigate = useNavigate();
  const { isApproved } = useApprovalStatus();

  const {
    register,
    handleSubmit,
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
    },
  });

  const onSubmit = async (data) => {
    try {
      await taskAPI.create({
        ...data,
        budget: Number(data.budget),
      });
      toastUtil.success("Task created");
      navigate("/company/my-tasks");
    } catch (err) {
      toastUtil.handleApiError(err);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-8">
        <ApprovalStatusBanner />

        { !isApproved ? (
          <div className="rounded-lg bg-warning/15 px-4 py-3 text-sm text-warning font-medium border border-warning/20">
            Your account is pending approval. You cannot post tasks until approved by an admin.
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <FormSection
            title="Task Overview"
            description="Provide a concise summary that vendors can quickly evaluate."
          >
            <Input
              label="Title"
              placeholder="e.g. Build a landing page"
              disabled={!isApproved}
              error={errors.title?.message}
              {...register("title")}
            />

            <Textarea
              label="Description"
              placeholder="Describe what needs to be done..."
              rows={4}
              disabled={!isApproved}
              error={errors.description?.message}
              {...register("description")}
            />
          </FormSection>

          <FormSection
            title="Scope & Requirements"
            description="List skills, tools, and deliverables expected from the vendor."
          >
            <Textarea
              label="Requirements"
              placeholder="List specific skills, tools, or deliverables..."
              rows={3}
              disabled={!isApproved}
              error={errors.requirements?.message}
              {...register("requirements")}
            />
          </FormSection>

          <FormSection
            title="Timeline & Budget"
            description="Set budget, completion window, and task category."
            footer={(
              <FormActionRow>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!isApproved}
                  className="w-full sm:w-auto font-bold uppercase tracking-tight"
                  title={!isApproved ? "Please wait for admin approval to post tasks" : undefined}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Post Task
                </Button>
              </FormActionRow>
            )}
          >
            <FormFieldGrid className="sm:grid-cols-3">
              <Input
                label="Budget (PKR)"
                type="number"
                placeholder="e.g. 50000"
                disabled={!isApproved}
                error={errors.budget?.message}
                {...register("budget")}
              />

              <Input
                label="Deadline"
                type="date"
                disabled={!isApproved}
                error={errors.deadline?.message}
                {...register("deadline")}
              />

              <Select
                label="Category"
                placeholder="Select a category"
                options={CATEGORIES}
                disabled={!isApproved}
                error={errors.category?.message}
                {...register("category")}
              />
            </FormFieldGrid>
          </FormSection>
        </form>
      </div>
    </PageTransition>
  );
};

export default AddTask;
