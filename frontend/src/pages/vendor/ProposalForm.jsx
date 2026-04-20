import React, { useState } from "react";
import api from "@/services/api";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import toastUtil from "@/lib/toast";
import FormSection, { FormActionRow, FormFieldGrid } from "@/components/shared/FormSection";
import { Button, Dialog, Input, Select, Textarea } from "@/components/ui";
import MilestonePencilor from "@/components/vendor/MilestonePencilor";
import DynamicListField from "@/components/shared/DynamicListField";

const emptyMilestone = { title: "", description: "", startAt: "", deadline: "", amount: "" };

const ProposalForm = ({
  taskId,
  companyId,
  open,
  onX,
  onProposalSubmitted,
}) => {
  const { isApproved } = useApprovalStatus();
  const [formData, setFormData] = useState({
    bidAmount: "",
    proposalText: "",
    proposedDeadline: "",
    skills: [""],
    experience: "",
    portfolioLinks: [""],
    availability: "immediate",
  });

  const [milestones, setMilestones] = useState([{ ...emptyMilestone }]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [milestoneErrors, setMilestoneErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const availabilityOptions = [
    { value: "immediate", label: "Immediate" },
    { value: "1-week", label: "Within 1 Week" },
    { value: "2-weeks", label: "Within 2 Weeks" },
    { value: "1-month", label: "Within 1 Month" },
  ];

  const resetForm = () => {
    setFormData({
      bidAmount: "",
      proposalText: "",
      proposedDeadline: "",
      skills: [""],
      experience: "",
      portfolioLinks: [""],
      availability: "immediate",
    });
    setMilestones([{ ...emptyMilestone }]);
    setFieldErrors({});
    setMilestoneErrors([]);
  };

  const handleX = () => {
    resetForm();
    onX();
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const addSkill = () => setFormData({ ...formData, skills: [...formData.skills, ""] });
  const removeSkill = (index) => setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) });

  const handlePortfolioChange = (index, value) => {
    const newLinks = [...formData.portfolioLinks];
    newLinks[index] = value;
    setFormData({ ...formData, portfolioLinks: newLinks });
  };

  const addPortfolioLink = () => setFormData({ ...formData, portfolioLinks: [...formData.portfolioLinks, ""] });
  const removePortfolioLink = (index) => setFormData({ ...formData, portfolioLinks: formData.portfolioLinks.filter((_, i) => i !== index) });

  const handleMilestoneChange = (index, field, value) => {
    const nextMilestones = [...milestones];
    nextMilestones[index] = { ...nextMilestones[index], [field]: value };
    setMilestones(nextMilestones);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { ...emptyMilestone }]);
    setMilestoneErrors((prev) => [...prev, {}]);
  };

  const removeMilestone = (index) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
      setMilestoneErrors((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.bidAmount || Number(formData.bidAmount) <= 0) {
      errors.bidAmount = "Bid amount is required";
    }
    if (!formData.proposedDeadline) {
      errors.proposedDeadline = "Proposed deadline is required";
    }
    if (!formData.proposalText.trim()) {
      errors.proposalText = "Proposal text is required";
    }
    if (!formData.experience.trim()) {
      errors.experience = "Relevant experience is required";
    }
    if (!formData.skills.some((skill) => skill.trim())) {
      errors.skills = "At least one skill is required";
    }

    const nextMilestoneErrors = milestones.map((milestone) => {
      const hasAnyValue = milestone.title.trim() || milestone.amount || milestone.deadline || milestone.startAt || milestone.description.trim();
      if (!hasAnyValue) {
        return {};
      }

      const milestoneError = {};
      if (!milestone.title.trim()) {
        milestoneError.title = "Title is required";
      }
      if (!milestone.amount || Number(milestone.amount) <= 0) {
        milestoneError.amount = "Amount must be greater than zero";
      }
      if (!milestone.deadline) {
        milestoneError.deadline = "Deadline is required";
      }
      return milestoneError;
    });

    setFieldErrors(errors);
    setMilestoneErrors(nextMilestoneErrors);

    return Object.keys(errors).length === 0 && nextMilestoneErrors.every((entry) => Object.keys(entry).length === 0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isApproved) {
      return;
    }

    if (!validateForm()) {
      toastUtil.validationError("Please fix the highlighted fields");
      return;
    }

    setLoading(true);

    try {
      const proposalData = {
        taskId,
        companyId,
        bidAmount: Number(formData.bidAmount),
        proposalText: formData.proposalText,
        proposedDeadline: formData.proposedDeadline,
        skills: formData.skills.filter((skill) => skill.trim() !== ""),
        experience: formData.experience,
        portfolioLinks: formData.portfolioLinks.filter((link) => link.trim() !== ""),
        availability: formData.availability,
        milestones: milestones
          .map((milestone) => ({
            ...milestone,
            amount: Number(milestone.amount) || 0,
          }))
          .filter((milestone) => milestone.title.trim() !== ""),
      };

      await api.post("/proposals", proposalData);
      toastUtil.success("Proposal submitted");
      onProposalSubmitted();
      handleX();
    } catch (error) {
      console.error("Proposal submission error:", error);
      toastUtil.handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onX={handleX} className="max-w-4xl">
      <Dialog.Header onX={handleX}>
        <Dialog.Title className="text-2xl font-bold">Submit Proposal</Dialog.Title>
        <Dialog.Description>Fill in your proposal details for this task</Dialog.Description>
      </Dialog.Header>

      <form onSubmit={handleSubmit} noValidate>
        <Dialog.Body className="space-y-6">
          {!isApproved ? (
            <div className="rounded-lg bg-warning-muted px-4 py-3 text-sm text-warning-muted-fg">
              Your account is pending approval. You cannot submit proposals until your account is approved by an admin.
            </div>
          ) : null}

          <FormSection title="Bid & Timeline" description="Define your commercial bid and expected completion date.">
            <FormFieldGrid>
              <Input
                type="number"
                name="bidAmount"
                label="Bid Amount ($) *"
                value={formData.bidAmount}
                onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                error={fieldErrors.bidAmount}
                disabled={!isApproved}
              />
              <Input
                type="date"
                name="proposedDeadline"
                label="Proposed Deadline *"
                value={formData.proposedDeadline}
                onChange={(e) => setFormData({ ...formData, proposedDeadline: e.target.value })}
                error={fieldErrors.proposedDeadline}
                disabled={!isApproved}
              />
            </FormFieldGrid>
          </FormSection>

          <FormSection title="Proposal Details" description="Explain your approach and why you are a strong fit.">
            <Textarea
              name="proposalText"
              label="Proposal Text *"
              rows={4}
              value={formData.proposalText}
              onChange={(e) => setFormData({ ...formData, proposalText: e.target.value })}
              placeholder="Describe your approach, methodology, and why you're the best fit for this project..."
              error={fieldErrors.proposalText}
              disabled={!isApproved}
            />

            <Textarea
              name="experience"
              label="Relevant Experience *"
              rows={3}
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Describe your relevant experience and past projects..."
              error={fieldErrors.experience}
              disabled={!isApproved}
            />

            <Select
              label="Availability *"
              value={formData.availability}
              onChange={(value) => setFormData({ ...formData, availability: value })}
              disabled={!isApproved}
              options={availabilityOptions}
            />
          </FormSection>

          <FormSection title="Skills & Portfolio" description="Share your capabilities and relevant links.">
            <DynamicListField
              label="Skills *"
              helperText="Add at least one skill relevant to this task."
              items={formData.skills}
              onChange={handleSkillChange}
              onAdd={addSkill}
              onRemove={removeSkill}
              placeholder="Skill"
              addLabel="Add Skill"
              disabled={!isApproved}
              required
              error={fieldErrors.skills}
            />

            <DynamicListField
              label="Portfolio Links"
              helperText="Optional links that support your proposal."
              items={formData.portfolioLinks}
              onChange={handlePortfolioChange}
              onAdd={addPortfolioLink}
              onRemove={removePortfolioLink}
              placeholder="https://example.com/portfolio"
              inputType="url"
              addLabel="Add Portfolio Link"
              disabled={!isApproved}
            />
          </FormSection>

          <FormSection title="Milestone Plan" description="Outline your delivery plan and payment split.">
            <MilestonePencilor
              milestones={milestones}
              onChange={handleMilestoneChange}
              onAdd={addMilestone}
              onRemove={removeMilestone}
              disabled={!isApproved}
              errors={milestoneErrors}
            />
          </FormSection>
        </Dialog.Body>

        <Dialog.Footer>
          <FormActionRow>
            <Button variant="secondary" type="button" onClick={handleX} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !isApproved}
              title={!isApproved ? "Please wait for admin approval to submit proposals" : ""}
            >
              Submit Proposal
            </Button>
          </FormActionRow>
        </Dialog.Footer>
      </form>
    </Dialog>
  );
};

export default ProposalForm;
