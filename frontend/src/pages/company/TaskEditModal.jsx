import React, { useEffect, useState } from "react";
import { 
  PencilSimple as Edit, 
  X as CloseIcon, 
  Plus,
  FloppyDisk,
  Briefcase,
  ListChecks,
  Tag,
  CurrencyDollar,
  Calendar,
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
  Select, 
  Textarea, 
  Label,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
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
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.string().min(30, "Requirements must be at least 30 characters"),
  budget: z.coerce.number().positive("Enter a valid budget"),
  deadline: z.string().min(1, "Deadline is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().default("medium"),
  taskType: z.string().default("fixed-price"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

const TaskEditModal = ({ open, task, onX, onSuccess }) => {
  const [skills, setSkills] = useState([""]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
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
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
        category: task.category,
        priority: task.priority || "medium",
        taskType: task.taskType || "fixed-price",
        skills: task.skills?.length > 0 ? task.skills : [""],
      });
      setSkills(task.skills?.length > 0 ? task.skills : [""]);
    }
  }, [task, open, reset]);

  const onSubmit = (data) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      const payload = {
        ...pendingData,
        budget: Number(pendingData.budget),
        skills: pendingData.skills.filter(s => s.trim() !== ""),
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

  const handleAddSkill = () => {
    const newSkills = [...skills, ""];
    setSkills(newSkills);
    setValue("skills", newSkills, { shouldDirty: true });
  };

  const handleRemoveSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
    setValue("skills", newSkills, { shouldDirty: true });
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
    setValue("skills", newSkills, { shouldDirty: true });
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
          <form id="edit-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <FormSection
              title="General Information"
              icon={<Briefcase className="h-4 w-4" />}
            >
              <FormFieldGrid>
                <Input
                  label="Task Title"
                  error={errors.title?.message}
                  className="md:col-span-2"
                  disabled={!isTaskOpen}
                  {...register("title")}
                />
                
                <Select
                  label="Category"
                  options={CATEGORIES}
                  error={errors.category?.message}
                  disabled={!isTaskOpen}
                  {...register("category")}
                />

                <Select
                  label="Priority Level"
                  options={PRIORITIES}
                  error={errors.priority?.message}
                  disabled={!isTaskOpen}
                  {...register("priority")}
                />
              </FormFieldGrid>
            </FormSection>

            <FormSection
              title="Detailed Brief"
              icon={<ListChecks className="h-4 w-4" />}
            >
              <div className="space-y-6">
                <Textarea
                  label="Project Description"
                  rows={4}
                  error={errors.description?.message}
                  disabled={!isTaskOpen}
                  {...register("description")}
                />

                <Textarea
                  label="Technical Requirements"
                  rows={3}
                  error={errors.requirements?.message}
                  disabled={!isTaskOpen}
                  {...register("requirements")}
                />
              </div>
            </FormSection>

            <FormSection
              title="Skills & Expertise"
              icon={<Tag className="h-4 w-4" />}
            >
              <Controller
                name="skills"
                control={control}
                render={() => (
                  <DynamicListField
                    label="Required Skills"
                    items={skills}
                    onAdd={handleAddSkill}
                    onRemove={handleRemoveSkill}
                    onChange={handleSkillChange}
                    placeholder="e.g. React.js"
                    addLabel="Add Skill"
                    error={errors.skills?.message}
                    disabled={!isTaskOpen}
                  />
                )}
              />
            </FormSection>

            <FormSection
              title="Timeline & Budget"
              icon={<CurrencyDollar className="h-4 w-4" />}
            >
              <FormFieldGrid className="sm:grid-cols-3">
                <Select
                  label="Payment Type"
                  options={TASK_TYPES}
                  error={errors.taskType?.message}
                  disabled={!isTaskOpen}
                  {...register("taskType")}
                />

                <Input
                  label="Budget (USD)"
                  type="number"
                  error={errors.budget?.message}
                  icon={<CurrencyDollar className="h-4 w-4" />}
                  disabled={!isTaskOpen}
                  {...register("budget")}
                />

                <Input
                  label="Deadline"
                  type="date"
                  error={errors.deadline?.message}
                  icon={<Calendar className="h-4 w-4" />}
                  disabled={!isTaskOpen}
                  {...register("deadline")}
                />
              </FormFieldGrid>
            </FormSection>
          </form>
        </Dialog.Body>

        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border/50 bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              onClick={onX}
              className="font-black uppercase tracking-widest text-[10px] h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-task-form"
              loading={isSubmitting}
              disabled={!isDirty || !isTaskOpen}
              className="font-black uppercase tracking-widest text-[10px] h-11 px-8"
            >
              <FloppyDisk className="mr-2 h-4 w-4" weight="bold" />
              Save Changes
            </Button>
        </div>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Updates</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This will update the task details visible to all potential vendors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Yes, Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskEditModal;
