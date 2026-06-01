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
import MilestoneEditor from "@/components/vendor/MilestoneEditor";
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
  milestones: z.array(milestoneSchema).optional().default([]),
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
    mode: "onChange",
    defaultValues: {
      bidAmount: "",
      proposalText: "",
      proposedDeadline: "",
      skills: [""],
      experience: "",
      portfolioLinks: [""],
      availability: "immediate",
      milestones: [],
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isValid },
  } = form;

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
        milestones: [],
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
        milestones: data.milestones?.filter(m => m.title?.trim() !== "") || [],
      };

      await api.post("/proposals", proposalData);
      toastUtil.success("Proposal submitted successfully!");
      onProposalSubmitted();
      onX();
    } catch (error) {
      console.error("Proposal submission error:", error);
      toastUtil.handleApiError(error);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onX={onX} className="max-w-5xl">
      <Dialog.Header onX={onX} className="px-8 pt-8 border-b-0">
        <Dialog.Title className="text-2xl font-black tracking-tight text-foreground uppercase">Submit Professional Proposal</Dialog.Title>
        <Dialog.Description className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Detail your approach and expertise for this task
        </Dialog.Description>
      </Dialog.Header>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Dialog.Body className="space-y-10 px-8 py-6 max-h-[70vh] overflow-y-auto">
            {!isApproved && (
              <div className="rounded-xl bg-warning/10 border border-warning/20 px-6 py-4 text-sm text-warning font-bold flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Your account is pending approval. You cannot submit proposals yet.
              </div>
            )}

            <FormSection title="Commercial Terms" icon={null} description="Define your bid and expected delivery timeframe.">
              <FormFieldGrid>
                <FormField
                  control={control}
                  name="bidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bid Amount (USD) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 500" {...field} disabled={!isApproved} className="h-12 rounded-xl" />
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proposed Deadline *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={!isApproved} className="h-12 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGrid>
            </FormSection>

            <FormSection title="Strategic Approach" description="Explain how you plan to tackle this project.">
              <div className="space-y-6">
                <FormField
                    control={control}
                    name="proposalText"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proposal Statement *</FormLabel>
                        <FormControl>
                        <Textarea
                            rows={5}
                            placeholder="Describe your approach, methodology, and unique value proposition..."
                            {...field}
                            disabled={!isApproved}
                            className="rounded-xl"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Relevant Experience *</FormLabel>
                        <FormControl>
                        <Textarea
                            rows={3}
                            placeholder="Briefly highlight past projects similar to this one..."
                            {...field}
                            disabled={!isApproved}
                            className="rounded-xl"
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Availability *</FormLabel>
                        <RadixSelect
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!isApproved}
                        >
                        <FormControl>
                            <RadixSelectTrigger className="h-12 rounded-xl">
                            <RadixSelectValue placeholder="Select when you can start" />
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
              </div>
            </FormSection>

            <FormSection title="Capabilities & Proof" description="List your technical stack and portfolio references.">
              <div className="space-y-8">
                <FormField
                    control={control}
                    name="skills"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Technical Skills *</FormLabel>
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
                            placeholder="Skill (e.g. React, Node.js)"
                            addLabel="Add Skill"
                            disabled={!isApproved}
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Portfolio / Relevant Links</FormLabel>
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
                            placeholder="https://..."
                            inputType="url"
                            addLabel="Add Link"
                            disabled={!isApproved}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </FormSection>

            <FormSection title="Milestone Plan (Optional)" description="Optionally break down the project into payable phases.">
              <FormField
                control={control}
                name="milestones"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MilestoneEditor
                        milestones={field.value || []}
                        onChange={(idx, f, val) => {
                          const next = [...(field.value || [])];
                          next[idx] = { ...next[idx], [f]: val };
                          field.onChange(next);
                        }}
                        onAdd={() => field.onChange([...(field.value || []), { ...emptyMilestone }])}
                        onRemove={(idx) => field.onChange((field.value || []).filter((_, i) => i !== idx))}
                        disabled={!isApproved}
                      />
                    </FormControl>
                    <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase italic">If left empty, the project will be treated as a single fixed-price engagement.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
          </Dialog.Body>

          <div className="grid-cols-2 grid gap-3 px-8 py-8 border-t border-border/50 bg-muted/20 rounded-b-lg">
              <Button 
                variant="ghost" 
                type="button" 
                onClick={onX} 
                disabled={isSubmitting}
                className="w-full font-semibold uppercase tracking-widest text-[10px] h-12 px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting || !isApproved || !isValid}
                className="w-full font-semibold uppercase tracking-widest text-[10px] h-12 px-12 shadow-lg"
              >
                Submit Proposal
              </Button></div>
        </form>
      </Form>
    </Dialog>
  );
};

export default ProposalForm;




