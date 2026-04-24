import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/services/api";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import toastUtil from "@/lib/toast";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import {
  Button,
  Dialog,
  Input,
  Textarea,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RadixSelect,
  RadixSelectTrigger,
  RadixSelectValue,
  RadixSelectContent,
  RadixSelectItem,
} from "@/components/ui";
import MilestonePencilor from "@/components/vendor/MilestonePencilor";
import DynamicListField from "@/components/shared/DynamicListField";

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
});

const proposalSchema = z.object({
  bidAmount: z.coerce.number().positive("Bid amount is required"),
  proposalText: z.string().min(1, "Proposal text is required"),
  proposedDeadline: z.string().min(1, "Proposed deadline is required"),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).min(1, "At least one skill is required"),
  experience: z.string().min(1, "Relevant experience is required"),
  portfolioLinks: z.array(z.string().url("Invalid URL").or(z.literal(""))),
  availability: z.string().min(1, "Availability is required"),
  milestones: z.array(milestoneSchema).optional(),
});

const emptyMilestone = { title: "", description: "", startAt: "", deadline: "", amount: "" };

const ProposalForm = ({
  taskId,
  companyId,
  open,
  onX,
  onProposalSubmitted,
}) => {
  const { isApproved } = useApprovalStatus();
  
  const form = useForm({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      bidAmount: "",
      proposalText: "",
      proposedDeadline: "",
      skills: [""],
      experience: "",
      portfolioLinks: [""],
      availability: "immediate",
      milestones: [{ ...emptyMilestone }],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = form;

  const milestones = watch("milestones");
  const skills = watch("skills");
  const portfolioLinks = watch("portfolioLinks");

  const availabilityOptions = [
    { value: "immediate", label: "Immediate" },
    { value: "1-week", label: "Within 1 Week" },
    { value: "2-weeks", label: "Within 2 Weeks" },
    { value: "1-month", label: "Within 1 Month" },
  ];

  useEffect(() => {
    if (open) {
      reset({
        bidAmount: "",
        proposalText: "",
        proposedDeadline: "",
        skills: [""],
        experience: "",
        portfolioLinks: [""],
        availability: "immediate",
        milestones: [{ ...emptyMilestone }],
      });
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    if (!isApproved) return;

    try {
      const proposalData = {
        ...data,
        taskId,
        companyId,
        skills: data.skills.filter(s => s.trim() !== ""),
        portfolioLinks: data.portfolioLinks.filter(l => l.trim() !== ""),
        milestones: data.milestones?.filter(m => m.title.trim() !== "") || [],
      };

      await api.post("/proposals", proposalData);
      toastUtil.success("Proposal submitted");
      onProposalSubmitted();
      onX();
    } catch (error) {
      console.error("Proposal submission error:", error);
      toastUtil.handleApiError(error);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onX={onX} className="max-w-4xl">
      <Dialog.Header onX={onX}>
        <Dialog.Title className="text-2xl font-bold">Submit Proposal</Dialog.Title>
        <Dialog.Description>Fill in your proposal details for this task</Dialog.Description>
      </Dialog.Header>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Dialog.Body className="space-y-6">
            {!isApproved && (
              <div className="rounded-lg bg-warning-muted px-4 py-3 text-sm text-warning-muted-fg">
                Your account is pending approval. You cannot submit proposals until your account is approved by an admin.
              </div>
            )}

            <FormSection title="Bid & Timeline" description="Define your commercial bid and expected completion date.">
              <FormFieldGrid>
                <FormField
                  control={control}
                  name="bidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bid Amount ($) *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={!isApproved} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="proposedDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposed Deadline *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={!isApproved} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGrid>
            </FormSection>

            <FormSection title="Proposal Details" description="Explain your approach and why you are a strong fit.">
              <FormField
                control={control}
                name="proposalText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Text *</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Describe your approach, methodology, and why you're the best fit for this project..."
                        {...field}
                        disabled={!isApproved}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relevant Experience *</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Describe your relevant experience and past projects..."
                        {...field}
                        disabled={!isApproved}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability *</FormLabel>
                    <RadixSelect
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isApproved}
                    >
                      <FormControl>
                        <RadixSelectTrigger>
                          <RadixSelectValue placeholder="Select availability" />
                        </RadixSelectTrigger>
                      </FormControl>
                      <RadixSelectContent>
                        {availabilityOptions.map((opt) => (
                          <RadixSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </RadixSelectItem>
                        ))}
                      </RadixSelectContent>
                    </RadixSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Skills & Portfolio" description="Share your capabilities and relevant links.">
              <FormField
                control={control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills *</FormLabel>
                    <FormControl>
                      <DynamicListField
                        items={field.value}
                        onChange={(idx, val) => {
                          const next = [...field.value];
                          next[idx] = val;
                          field.onChange(next);
                        }}
                        onAdd={() => field.onChange([...field.value, ""])}
                        onRemove={(idx) => field.onChange(field.value.filter((_, i) => i !== idx))}
                        placeholder="Skill"
                        addLabel="Add Skill"
                        disabled={!isApproved}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="portfolioLinks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio Links</FormLabel>
                    <FormControl>
                      <DynamicListField
                        items={field.value}
                        onChange={(idx, val) => {
                          const next = [...field.value];
                          next[idx] = val;
                          field.onChange(next);
                        }}
                        onAdd={() => field.onChange([...field.value, ""])}
                        onRemove={(idx) => field.onChange(field.value.filter((_, i) => i !== idx))}
                        placeholder="https://example.com/portfolio"
                        inputType="url"
                        addLabel="Add Portfolio Link"
                        disabled={!isApproved}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Milestone Plan" description="Outline your delivery plan and payment split.">
              <FormField
                control={control}
                name="milestones"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MilestonePencilor
                        milestones={field.value}
                        onChange={(idx, f, val) => {
                          const next = [...field.value];
                          next[idx] = { ...next[idx], [f]: val };
                          field.onChange(next);
                        }}
                        onAdd={() => field.onChange([...field.value, { ...emptyMilestone }])}
                        onRemove={(idx) => field.onChange(field.value.filter((_, i) => i !== idx))}
                        disabled={!isApproved}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
          </Dialog.Body>

          <Dialog.Footer>
            <FormActionRow>
              <Button variant="secondary" type="button" onClick={onX} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting || !isApproved}
                title={!isApproved ? "Please wait for admin approval to submit proposals" : ""}
              >
                Submit Proposal
              </Button>
            </FormActionRow>
          </Dialog.Footer>
        </form>
      </Form>
    </Dialog>
  );
};

export default ProposalForm;



