import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash } from "@phosphor-icons/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contractAPI, proposalAPI } from "@/services/api";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import {
  Button,
  Card,
  Checkbox,
  Input,
  PageTransition,
  Textarea,
  Skeleton,
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

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  deadline: z.string().min(1, "Deadline is required"),
});

const contractFormSchema = z.object({
  proposalId: z.string().min(1, "Proposal ID is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  scope: z.string().optional(),
  deliverables: z.string().optional(),
  projectStartDate: z.string().min(1, "Start date is required"),
  projectEndDate: z.string().optional(),
  milestones: z.array(milestoneSchema).min(1, "At least one milestone is required"),
  paymentTerms: z.string(),
  paymentMethod: z.string(),
  revisionLimit: z.coerce.number().min(0),
  revisionPolicy: z.string().optional(),
  intellectualProperty: z.string(),
  confidentialityClause: z.boolean(),
  confidentialityPeriod: z.coerce.number().min(0),
  terminationClause: z.string().optional(),
  noticePeriod: z.coerce.number().min(0),
  disputeResolution: z.string(),
  governingLaw: z.string().optional(),
  warrantyPeriod: z.coerce.number().min(0),
});

const emptyMilestone = { title: "", description: "", amount: "", deadline: "" };

const CreateContract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const proposalIdFromUrl = searchParams.get("proposalId");

  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      proposalId: proposalIdFromUrl || "",
      title: "",
      description: "",
      category: "",
      scope: "",
      deliverables: "",
      projectStartDate: new Date().toISOString().split("T")[0],
      projectEndDate: "",
      milestones: [{ ...emptyMilestone }],
      paymentTerms: "milestone",
      paymentMethod: "bank-transfer",
      revisionLimit: 3,
      revisionPolicy: "",
      intellectualProperty: "company",
      confidentialityClause: true,
      confidentialityPeriod: 24,
      terminationClause: "Either party may terminate this agreement with 7 days written notice.",
      noticePeriod: 7,
      disputeResolution: "negotiation",
      governingLaw: "India",
      warrantyPeriod: 30,
    },
  });

  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "milestones",
  });

  const milestonesWatch = watch("milestones");
  const totalBudget = useMemo(
    () => milestonesWatch.reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
    [milestonesWatch]
  );

  const fetchProposalDetails = useCallback(async (id) => {
    try {
      setFetching(true);
      const res = await proposalAPI.getCompanyProposals();
      const proposal = res.data?.find(p => p._id === id);
      
      if (proposal) {
        reset({
          ...form.getValues(),
          proposalId: id,
          title: `Contract for ${proposal.taskId?.title || "Project"}`,
          description: proposal.taskId?.description || "",
          category: proposal.taskId?.category || "",
          scope: proposal.proposalText || proposal.taskId?.description || "",
          deliverables: proposal.taskId?.requirements || "",
          projectEndDate: proposal.proposedDeadline ? new Date(proposal.proposedDeadline).toISOString().split("T")[0] : "",
          milestones: proposal.milestones?.length > 0 
            ? proposal.milestones.map(m => ({
                title: m.title || "Milestone",
                description: m.description || "",
                amount: m.amount || 0,
                deadline: m.deadline ? new Date(m.deadline).toISOString().split("T")[0] : ""
              }))
            : [{
                title: "Initial Delivery",
                description: "Primary project deliverables",
                amount: proposal.bidAmount || 0,
                deadline: proposal.proposedDeadline ? new Date(proposal.proposedDeadline).toISOString().split("T")[0] : ""
              }]
        });
      }
    } catch (err) {
      console.error("Error fetching proposal:", err);
    } finally {
      setFetching(false);
    }
  }, [reset, form]);

  useEffect(() => {
    if (proposalIdFromUrl) {
      fetchProposalDetails(proposalIdFromUrl);
    }
  }, [proposalIdFromUrl, fetchProposalDetails]);

  const onSubmit = async (data) => {
    setError("");
    try {
      await contractAPI.createCompleteContract(data);
      navigate("/company/contracts");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create contract");
    }
  };

  if (fetching) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-5xl space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase">Create Contract</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Define scope, milestones, and payment terms before issuing.</p>
          </div>
          <Button type="button" variant="secondary" size="xs" onClick={() => navigate(-1)} className="font-bold uppercase tracking-tight">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {error && (
          <div className="rounded-xl bg-error/15 px-4 py-3 text-sm text-error font-medium border border-error/20">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            <FormSection title="Contract Context" description="Link this contract to a proposal and define its core identity.">
              <FormFieldGrid>
                <FormField
                  control={control}
                  name="proposalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal ID *</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-filled from proposal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="warrantyPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Period (days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGrid>

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Scope & Timeline" description="Document work scope, expected deliverables, and project dates.">
              <FormFieldGrid>
                <FormField
                  control={control}
                  name="projectStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="projectEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
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
                    <FormLabel>Scope</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="deliverables"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deliverables</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Milestones & Budget"
              description="Break work into milestones with amount and deadline expectations."
              actions={<span className="text-xs font-bold uppercase tracking-tight text-[var(--muted-foreground)]">Total: PKR {totalBudget.toLocaleString()}</span>}
            >
              {fields.map((field, index) => (
                <Card key={field.id} className="border-dashed shadow-none bg-[var(--card)]/50">
                  <div className="p-4 border-b border-[var(--border)]/50 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-tight">Milestone {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => remove(index)}
                        className="text-error hover:bg-error/10"
                      >
                        <Trash className="h-3.5 w-3.5 mr-1.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    <FormFieldGrid>
                      <FormField
                        control={control}
                        name={`milestones.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Milestone Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`milestones.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (PKR)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
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
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`milestones.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FormFieldGrid>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => append({ ...emptyMilestone })}
                className="font-bold uppercase tracking-tight"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Milestone
              </Button>
            </FormSection>

            <FormSection title="Payment & Legal Terms" description="Set payment operations and contractual protections.">
              <FormFieldGrid className="sm:grid-cols-3">
                <FormField
                  control={control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <RadixSelect onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <RadixSelectTrigger>
                            <RadixSelectValue placeholder="Select terms" />
                          </RadixSelectTrigger>
                        </FormControl>
                        <RadixSelectContent>
                          <RadixSelectItem value="milestone">Milestone</RadixSelectItem>
                          <RadixSelectItem value="hourly">Hourly</RadixSelectItem>
                          <RadixSelectItem value="fixed">Fixed</RadixSelectItem>
                          <RadixSelectItem value="monthly">Monthly</RadixSelectItem>
                        </RadixSelectContent>
                      </RadixSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <RadixSelect onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <RadixSelectTrigger>
                            <RadixSelectValue placeholder="Select method" />
                          </RadixSelectTrigger>
                        </FormControl>
                        <RadixSelectContent>
                          <RadixSelectItem value="bank-transfer">Bank Transfer</RadixSelectItem>
                          <RadixSelectItem value="stripe">Stripe</RadixSelectItem>
                          <RadixSelectItem value="paypal">PayPal</RadixSelectItem>
                        </RadixSelectContent>
                      </RadixSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="revisionLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision Limit</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="intellectualProperty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Ownership</FormLabel>
                      <RadixSelect onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <RadixSelectTrigger>
                            <RadixSelectValue placeholder="Select owner" />
                          </RadixSelectTrigger>
                        </FormControl>
                        <RadixSelectContent>
                          <RadixSelectItem value="company">Company</RadixSelectItem>
                          <RadixSelectItem value="vendor">Vendor</RadixSelectItem>
                          <RadixSelectItem value="shared">Shared</RadixSelectItem>
                        </RadixSelectContent>
                      </RadixSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="confidentialityPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidentiality Period (months)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="noticePeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notice Period (days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="disputeResolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dispute Resolution</FormLabel>
                      <RadixSelect onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <RadixSelectTrigger>
                            <RadixSelectValue placeholder="Select method" />
                          </RadixSelectTrigger>
                        </FormControl>
                        <RadixSelectContent>
                          <RadixSelectItem value="negotiation">Negotiation</RadixSelectItem>
                          <RadixSelectItem value="mediation">Mediation</RadixSelectItem>
                          <RadixSelectItem value="arbitration">Arbitration</RadixSelectItem>
                          <RadixSelectItem value="litigation">Litigation</RadixSelectItem>
                        </RadixSelectContent>
                      </RadixSelect>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="governingLaw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Governing Law</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGrid>

              <FormField
                control={control}
                name="revisionPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Policy</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="terminationClause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termination Clause</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="confidentialityClause"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 transition-colors hover:bg-[var(--muted)]/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer font-bold uppercase tracking-tight text-xs">
                        Include Confidentiality Clause
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection
              title="Finalize Contract"
              description="Review details before issuing this contract to the selected vendor."
              footer={(
                <FormActionRow>
                  <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="w-full sm:w-auto font-bold uppercase tracking-tight" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto font-bold uppercase tracking-tight" disabled={isSubmitting}>
                    Create Contract
                  </Button>
                </FormActionRow>
              )}
            >
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Ensure payment terms, milestones, and legal clauses match the proposal before submission.
              </p>
            </FormSection>
          </form>
        </Form>
      </div>
    </PageTransition>
  );
};

export default CreateContract;
