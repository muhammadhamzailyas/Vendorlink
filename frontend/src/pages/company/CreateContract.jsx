import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash, Sparkle } from "@phosphor-icons/react";
import { z } from "zod";
import { contractAPI, proposalAPI } from "@/services/api";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import { Button, Card, Checkbox, Input, Label, PageTransition, Select, Textarea, Skeleton } from "@/components/ui";

const emptyMilestone = { title: "", description: "", amount: "", deadline: "" };

const contractSchema = z.object({
  proposalId: z.string().trim().min(1, "Proposal ID is required"),
});

const CreateContract = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const proposalId = searchParams.get("proposalId");

  const [form, setForm] = useState({
    proposalId: proposalId || "",
    title: "",
    description: "",
    category: "",
    scope: "",
    deliverables: "",
    projectStartDate: new Date().toISOString().split("T")[0],
    projectEndDate: "",
    milestones: [{ ...emptyMilestone }],
    paymentTerms: "milestone",
    paymentClock: "milestone-based",
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
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [milestoneErrors, setMilestoneErrors] = useState([]);

  const fetchProposalDetails = useCallback(async (id) => {
    try {
      setFetching(true);
      // We don't have a getProposalById but we can find it in the list or add an endpoint
      // For now, let's assume we might need to add this endpoint or use getCompanyProposals and filter
      const res = await proposalAPI.getCompanyProposals();
      const proposal = res.data?.find(p => p._id === id);
      
      if (proposal) {
        setForm(prev => ({
          ...prev,
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
                deadline: m.deadline ? new Date(m.deadline).toISOString().split("T")[0] : prev.projectEndDate
              }))
            : [{
                title: "Initial Delivery",
                description: "Primary project deliverables",
                amount: proposal.bidAmount || 0,
                deadline: proposal.proposedDeadline ? new Date(proposal.proposedDeadline).toISOString().split("T")[0] : ""
              }]
        }));
      }
    } catch (err) {
      console.error("Error fetching proposal:", err);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetails(proposalId);
    }
  }, [proposalId, fetchProposalDetails]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addMilestone = () => {
    setForm((prev) => ({ ...prev, milestones: [...prev.milestones, { ...emptyMilestone }] }));
    setMilestoneErrors((prev) => [...prev, {}]);
  };

  const removeMilestone = (index) => {
    setForm((prev) => ({ ...prev, milestones: prev.milestones.filter((_, idx) => idx !== index) }));
    setMilestoneErrors((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateMilestone = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.map((milestone, idx) => (idx === index ? { ...milestone, [field]: value } : milestone)),
    }));
  };

  const totalBudget = useMemo(
    () => form.milestones.reduce((sum, milestone) => sum + (Number(milestone.amount) || 0), 0),
    [form.milestones]
  );

  const validateMilestones = () => {
    const nextErrors = form.milestones.map((milestone) => {
      const hasAnyValue =
        milestone.title.trim() ||
        milestone.description.trim() ||
        milestone.amount ||
        milestone.deadline;

      if (!hasAnyValue) {
        return {};
      }

      const errors = {};
      if (!milestone.title.trim()) {
        errors.title = "Title is required when milestone details are provided";
      }
      if (!milestone.amount || Number(milestone.amount) <= 0) {
        errors.amount = "Amount must be greater than zero";
      }
      if (!milestone.deadline) {
        errors.deadline = "Deadline is required";
      }
      return errors;
    });

    setMilestoneErrors(nextErrors);
    return nextErrors.every((entry) => Object.keys(entry).length === 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const schemaResult = contractSchema.safeParse({ proposalId: form.proposalId });
    if (!schemaResult.success) {
      const flattened = schemaResult.error.flatten().fieldErrors;
      setFieldErrors({ proposalId: flattened.proposalId?.[0] || "Proposal ID is required" });
      return;
    }

    setFieldErrors({});

    if (!validateMilestones()) {
      return;
    }

    setLoading(true);

    try {
      await contractAPI.createCompleteContract(form);
      navigate("/company/contracts");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create contract");
    } finally {
      setLoading(false);
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

        {error ? <div className="rounded-xl bg-blush-400/15 px-4 py-3 text-sm text-blush-600 font-medium border border-blush-400/20">{error}</div> : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <FormSection
            title="Contract Context"
            description="Link this contract to a proposal and define its core identity."
          >
            <FormFieldGrid>
              <Input
                label="Proposal ID *"
                value={form.proposalId}
                onChange={(e) => set("proposalId", e.target.value)}
                error={fieldErrors.proposalId}
              />
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Auto-filled from proposal if left blank"
              />
              <Input
                label="Category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
              <Input
                label="Warranty Period (days)"
                type="number"
                value={form.warrantyPeriod}
                onChange={(e) => set("warrantyPeriod", Number(e.target.value) || 0)}
              />
            </FormFieldGrid>

            <Textarea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </FormSection>

          <FormSection
            title="Scope & Timeline"
            description="Document work scope, expected deliverables, and project dates."
          >
            <FormFieldGrid>
              <Input
                label="Project Start Date"
                type="date"
                value={form.projectStartDate}
                onChange={(e) => set("projectStartDate", e.target.value)}
              />
              <Input
                label="Project End Date"
                type="date"
                value={form.projectEndDate}
                onChange={(e) => set("projectEndDate", e.target.value)}
              />
            </FormFieldGrid>

            <Textarea
              label="Scope"
              rows={3}
              value={form.scope}
              onChange={(e) => set("scope", e.target.value)}
            />

            <Textarea
              label="Deliverables"
              rows={3}
              value={form.deliverables}
              onChange={(e) => set("deliverables", e.target.value)}
            />
          </FormSection>

          <FormSection
            title="Milestones & Budget"
            description="Break work into milestones with amount and deadline expectations."
            actions={<span className="text-xs font-bold uppercase tracking-tight text-[var(--muted-foreground)]">Total: PKR {totalBudget.toLocaleString()}</span>}
          >
            {form.milestones.map((milestone, index) => (
              <Card key={index} className="border-dashed shadow-none bg-[var(--card)]/50">
                <div className="p-4 border-b border-[var(--border)]/50 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-tight">Milestone {index + 1}</h4>
                  {form.milestones.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => removeMilestone(index)}
                      className="text-blush-600 hover:bg-blush-400/10"
                    >
                      <Trash className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="p-4 space-y-4">
                  <FormFieldGrid>
                    <Input
                      label="Milestone Title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, "title", e.target.value)}
                      error={milestoneErrors[index]?.title}
                    />
                    <Input
                      label="Amount (PKR)"
                      type="number"
                      value={milestone.amount}
                      onChange={(e) => updateMilestone(index, "amount", e.target.value)}
                      error={milestoneErrors[index]?.amount}
                    />
                    <Textarea
                      label="Description"
                      rows={2}
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, "description", e.target.value)}
                    />
                    <Input
                      label="Deadline"
                      type="date"
                      value={milestone.deadline}
                      onChange={(e) => updateMilestone(index, "deadline", e.target.value)}
                      error={milestoneErrors[index]?.deadline}
                    />
                  </FormFieldGrid>
                </div>
              </Card>
            ))}

            <Button type="button" variant="secondary" size="xs" onClick={addMilestone} className="font-bold uppercase tracking-tight">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Milestone
            </Button>
          </FormSection>

          <FormSection
            title="Payment & Legal Terms"
            description="Set payment operations and contractual protections."
          >
            <FormFieldGrid className="sm:grid-cols-3">
              <Select 
                label="Payment Terms" 
                value={form.paymentTerms} 
                onChange={(value) => set("paymentTerms", value)}
                options={[
                  { value: "milestone", label: "Milestone" },
                  { value: "hourly", label: "Hourly" },
                  { value: "fixed", label: "Fixed" },
                  { value: "monthly", label: "Monthly" },
                ]}
              />

              <Select 
                label="Payment Method" 
                value={form.paymentMethod} 
                onChange={(value) => set("paymentMethod", value)}
                options={[
                  { value: "bank-transfer", label: "Prohibitk Transfer" },
                  { value: "stripe", label: "Stripe" },
                  { value: "paypal", label: "PayPal" },
                  { value: "crypto", label: "Crypto" },
                ]}
              />

              <Input
                label="Revision Limit"
                type="number"
                value={form.revisionLimit}
                onChange={(e) => set("revisionLimit", Number(e.target.value) || 0)}
              />

              <Select 
                label="IP Ownership" 
                value={form.intellectualProperty} 
                onChange={(value) => set("intellectualProperty", value)}
                options={[
                  { value: "company", label: "Company" },
                  { value: "vendor", label: "Vendor" },
                  { value: "shared", label: "Shared" },
                ]}
              />

              <Input
                label="Confidentiality Period (months)"
                type="number"
                value={form.confidentialityPeriod}
                onChange={(e) => set("confidentialityPeriod", Number(e.target.value) || 0)}
              />

              <Input
                label="Notice Period (days)"
                type="number"
                value={form.noticePeriod}
                onChange={(e) => set("noticePeriod", Number(e.target.value) || 0)}
              />

              <Select 
                label="Dispute Resolution" 
                value={form.disputeResolution} 
                onChange={(value) => set("disputeResolution", value)}
                options={[
                  { value: "negotiation", label: "Negotiation" },
                  { value: "mediation", label: "Mediation" },
                  { value: "arbitration", label: "Arbitration" },
                  { value: "litigation", label: "Litigation" },
                ]}
              />

              <Input
                label="Governing Law"
                value={form.governingLaw}
                onChange={(e) => set("governingLaw", e.target.value)}
              />
            </FormFieldGrid>

            <Textarea
              label="Revision Policy"
              rows={2}
              value={form.revisionPolicy}
              onChange={(e) => set("revisionPolicy", e.target.value)}
            />

            <Textarea
              label="Termination Clause"
              rows={3}
              value={form.terminationClause}
              onChange={(e) => set("terminationClause", e.target.value)}
            />

            <Label
              htmlFor="confidentiality"
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-sm text-[var(--foreground)]/80 cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
            >
              <Checkbox
                id="confidentiality"
                checked={form.confidentialityClause}
                onCheckedChange={(checked) => set("confidentialityClause", Boolean(checked))}
              />
              <span className="font-bold uppercase tracking-tight text-xs">Include Confidentiality Clause</span>
            </Label>
          </FormSection>

          <FormSection
            title="Finalize Contract"
            description="Review details before issuing this contract to the selected vendor."
            footer={(
              <FormActionRow>
                <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="w-full sm:w-auto font-bold uppercase tracking-tight">
                  Cancel
                </Button>
                <Button type="submit" loading={loading} className="w-full sm:w-auto font-bold uppercase tracking-tight">
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
      </div>
    </PageTransition>
  );
};

export default CreateContract;
