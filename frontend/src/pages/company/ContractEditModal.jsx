import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  X as CloseIcon, 
  Plus, 
  Trash,
  FloppyDisk,
  Briefcase,
  ListChecks,
  CurrencyDollar,
  Calendar,
  PencilSimple as Edit
} from "@phosphor-icons/react";
import { contractAPI } from "@/services/api";
import toastUtil from "@/lib/toast";
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
  Card,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";

const milestoneSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  deadline: z.string().min(1, "Deadline is required"),
  description: z.string().optional(),
});

const contractFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(30, "Description should be at least 30 characters"),
  scope: z.string().min(50, "Scope must be at least 50 characters"),
  deliverables: z.string().min(20, "Deliverables must be at least 20 characters"),
  projectStartDate: z.string().min(1, "Start date is required"),
  projectEndDate: z.string().min(1, "End date is required"),
  milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
  paymentTerms: z.string(),
  intellectualProperty: z.string(),
  confidentialityPeriod: z.coerce.number().min(0),
  noticePeriod: z.coerce.number().min(0),
  disputeResolution: z.string(),
  governingLaw: z.string().optional(),
});

const ContractEditModal = ({ open, contract, onX, onSuccess }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const form = useForm({
    resolver: zodResolver(contractFormSchema),
  });

  const { control, handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  useEffect(() => {
    if (contract && open) {
      reset({
        title: contract.title,
        description: contract.description,
        scope: contract.scope,
        deliverables: contract.deliverables,
        projectStartDate: contract.projectStartDate ? new Date(contract.projectStartDate).toISOString().split('T')[0] : "",
        projectEndDate: contract.projectEndDate ? new Date(contract.projectEndDate).toISOString().split('T')[0] : "",
        milestones: contract.milestones?.map(m => ({
          title: m.title,
          amount: m.amount,
          deadline: m.deadline ? new Date(m.deadline).toISOString().split('T')[0] : "",
          description: m.description || ""
        })) || [],
        paymentTerms: contract.paymentTerms,
        intellectualProperty: contract.intellectualProperty,
        confidentialityPeriod: contract.confidentialityPeriod,
        noticePeriod: contract.noticePeriod,
        disputeResolution: contract.disputeResolution,
        governingLaw: contract.governingLaw || "",
      });
    }
  }, [contract, open, reset]);

  const onSubmit = (data) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    try {
      await contractAPI.updateContract(contract._id, pendingData);
      toastUtil.success("Contract updated successfully");
      onSuccess();
      onX();
    } catch (err) {
      toastUtil.handleApiError(err);
    } finally {
      setConfirmOpen(false);
    }
  };

  if (!open) return null;

  const isEditable = ["draft", "pending-vendor"].includes(contract?.status);

  return (
    <>
      <Dialog open={open} onX={onX} className="sm:max-w-4xl">
        <Dialog.Header onX={onX} className="border-b-0 px-8 pt-10 pb-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 rounded-full bg-muted/50 text-foreground">
              <Edit size={32} weight="bold" />
            </div>
            <div className="space-y-1.5">
              <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
                Edit Contract Agreement
              </Dialog.Title>
              <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Modify terms before final execution
              </Dialog.Description>
            </div>
          </div>
        </Dialog.Header>

        {!isEditable ? (
          <Dialog.Body className="px-8 pb-10">
            <div className="rounded-xl bg-warning/10 border border-warning/20 p-6 text-center space-y-2">
                <p className="text-sm font-black text-warning uppercase">Modification Restricted</p>
                <p className="text-xs font-medium text-muted-foreground">This contract has been accepted and is now active or completed. Terms can no longer be modified.</p>
                <Button variant="outline" onClick={onX} className="mt-4 uppercase text-[10px] font-semibold tracking-widest">Close</Button>
            </div>
          </Dialog.Body>
        ) : (
          <Form {...form}>
            <form id="edit-contract-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <Dialog.Body className="px-8 pb-8 max-h-[60vh] overflow-y-auto space-y-10">
                <FormSection title="Core Identity" icon={<Briefcase size={16} />}>
                  <FormFieldGrid>
                    <FormField
                      control={control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Title</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea rows={2} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormFieldGrid>
                </FormSection>

                <FormSection title="Scope & Timeline" icon={<ListChecks size={16} />}>
                  <div className="space-y-6">
                    <FormFieldGrid>
                        <FormField
                        control={control}
                        name="projectStartDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={control}
                        name="projectEndDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </FormFieldGrid>
                    <FormField
                      control={control}
                      name="scope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scope of Work</FormLabel>
                          <FormControl><Textarea rows={3} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>

                <FormSection title="Milestones" icon={<CurrencyDollar size={16} />}>
                   <div className="space-y-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="border-dashed shadow-none p-4 relative pt-10">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 text-error h-8 w-8"
                                onClick={() => remove(index)}
                            >
                                
                            </Button>
                            <FormFieldGrid>
                                <FormField
                                    control={control}
                                    name={`milestones.${index}.title`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`milestones.${index}.amount`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount ($)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`milestones.${index}.deadline`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deadline</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </FormFieldGrid>
                        </Card>
                    ))}
                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="xs" 
                        className="w-full"
                        onClick={() => append({ title: "", amount: 0, deadline: "", description: "" })}
                    >
                         Add Milestone
                    </Button>
                   </div>
                </FormSection>
              </Dialog.Body>

              <div className="grid-cols-2 grid gap-3 px-8 py-6 border-t border-border/50 bg-muted/20">
                <Button type="button" variant="ghost" onClick={onX} className="w-full uppercase text-[10px] font-semibold tracking-widest h-11 px-6">Cancel</Button>
                <Button type="submit" loading={isSubmitting} disabled={!isDirty} className="w-full uppercase text-[10px] font-semibold tracking-widest h-11 px-8">
                   Save Agreement
                </Button></div>
            </form>
          </Form>
        )}
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to update this contract? This will reset the approval status and notify the vendor to review the new terms.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirmSave}>Yes, Update Contract</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContractEditModal;

