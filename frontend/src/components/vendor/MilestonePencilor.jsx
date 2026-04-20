import React from "react";
import { Plus as Add, Trash as Delete } from "@phosphor-icons/react";
import { Button, Card, Input, Textarea } from "../ui";

const MilestonePencilor = ({ milestones, onChange, onAdd, onRemove, disabled, errors = [] }) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-[var(--foreground)]">Project Milestones (Optional)</h3>
      <p className="text-xs text-[var(--muted-foreground)]">Break work into milestones for clearer delivery and payment checkpoints.</p>
    </div>

    {milestones.map((milestone, index) => {
      const milestoneErrors = errors[index] || {};

      return (
        <Card key={index} className="border-dashed">
          <Card.Header className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Card.Title className="text-sm">Milestone {index + 1}</Card.Title>
            {milestones.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Delete className="h-4 w-4" />}
                onClick={() => onRemove(index)}
                disabled={disabled}
              >
                Remove
              </Button>
            ) : null}
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Milestone Title"
                value={milestone.title}
                onChange={(e) => onChange(index, "title", e.target.value)}
                placeholder="e.g., Design Phase"
                disabled={disabled}
                error={milestoneErrors.title}
              />

              <Input
                label="Amount ($)"
                type="number"
                value={milestone.amount}
                onChange={(e) => onChange(index, "amount", e.target.value)}
                placeholder="Amount for this milestone"
                disabled={disabled}
                error={milestoneErrors.amount}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  rows={2}
                  value={milestone.description}
                  onChange={(e) => onChange(index, "description", e.target.value)}
                  placeholder="Describe what this milestone includes..."
                  disabled={disabled}
                />
              </div>

              <Input
                label="Start Date"
                type="date"
                value={milestone.startAt}
                onChange={(e) => onChange(index, "startAt", e.target.value)}
                disabled={disabled}
              />

              <Input
                label="Deadline"
                type="date"
                value={milestone.deadline}
                onChange={(e) => onChange(index, "deadline", e.target.value)}
                disabled={disabled}
                error={milestoneErrors.deadline}
              />
            </div>
          </Card.Content>
        </Card>
      );
    })}

    <Button
      type="button"
      variant="secondary"
      size="sm"
      icon={<Add className="h-4 w-4" />}
      onClick={onAdd}
      disabled={disabled}
    >
      Add Milestone
    </Button>
  </div>
);

export default MilestonePencilor;
