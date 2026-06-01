import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/services/api";
import { cn } from "@/lib/cn";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui";
import MilestoneEditor from "@/components/vendor/MilestoneEditor";
import DynamicListField from "@/components/shared/DynamicListField";
import { FloppyDisk, PencilSimple as Edit } from "@phosphor-icons/react";

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

const DetailLabel = ({ children, className }) => (
    <span className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground", className)}>
        {children}
    </span>
);

const ProposalUpdateModal = ({
  proposal,
  open,
  onX,
  onSuccess,
}) => {
  const { isApproved } = useApprovalStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(proposalSchema),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = form;

  const availabilityOptions = [
    { value: "immediate", label: "Immediate" },
    { value: "1-week", label: "Within 1 Week" },
    { value: "2-weeks", label: "Within 2 Weeks" },
    { value: "1-month", label: "Within 1 Month" },
  ];

  useEffect(() => {
    if (proposal && open) {
      reset({
        bidAmount: proposal.bidAmount,
        proposalText: proposal.proposalText,
        proposedDeadline: proposal.proposedDeadline ? new Date(proposal.proposedDeadline).toISOString().split('T')[0] : "",
        skills: proposal.skills?.length > 0 ? proposal.skills : [""],
        experience: proposal.experience || "",
        portfolioLinks: proposal.portfolioLinks?.length > 0 ? proposal.portfolioLinks : [""],
        availability: proposal.availability || "immediate",
        milestones: proposal.milestones || [],
      });
    }
  }, [proposal, open, reset]);

  const onSubmit = (data) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!isApproved) return;

    try {
      const payload = {
        ...pendingData,
        bidAmount: Number(pendingData.bidAmount),
        skills: pendingData.skills.filter(s => s.trim() !== ""),
        portfolioLinks: pendingData.portfolioLinks.filter(l => l.trim() !== ""),
        milestones: pendingData.milestones?.filter(m => m.title?.trim() !== "") || [],
      };

      await api.put(`/proposals/${proposal._id}`, payload);
      toastUtil.success("Proposal updated successfully");
      onSuccess();
      onX();
    } catch (error) {
      console.error("Proposal update error:", error);
      toastUtil.handleApiError(error);
    } finally {
        setConfirmOpen(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onX={onX} className="sm:max-w-6xl">
        <Dialog.Header className="px-8 pt-8 border-b-0">
          <div className="flex flex-col items-center gap-4 text-center w-full">
            <div className="p-3 rounded-full bg-muted/50 text-foreground">
              <Edit size={32} weight="bold" />
            </div>
            <div className="space-y-1.5">
              <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
                Update My Proposal
              </Dialog.Title>
              <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Modify your bid, timeline, or strategic approach
              </Dialog.Description>
            </div>
          </div>
        </Dialog.Header>

        <Form {...form}>
          <form id="update-proposal-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Dialog.Body className="space-y-10 px-8 py-6 max-h-[65vh] overflow-y-auto">
              <FormSection title="Commercial Terms" description="Adjust your bid and delivery timeframe.">
                <FormFieldGrid>
                  <FormField
                    control={control}
                    name="bidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bid Amount (USD) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={!isApproved} className="h-12 rounded-xl" />
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

              <FormSection title="Strategic Approach" description="Refine your statement and experience details.">
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
                              {...field}
                              disabled={!isApproved}
                              className="rounded-xl"
                          />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                      )}
                  />
                </div>
              </FormSection>

              <FormSection title="Capabilities & Milestones" description="Update your skills and optionally adjust the milestone plan.">
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
                              placeholder="Skill"
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
                    name="milestones"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Milestone Plan (Optional)</FormLabel>
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
                        <FormMessage />
                    </FormItem>
                    )}
                  />
                </div>
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
                    disabled={!isDirty || !isApproved}
                    className="w-full font-semibold uppercase tracking-widest text-[10px] h-12 px-12 shadow-lg"
                >
                    
                    Save Changes
                </Button></div>
          </form>
        </Form>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Updates</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to your proposal? This will immediately update the information visible to the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmSave}>Yes, Save</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProposalUpdateModal;

