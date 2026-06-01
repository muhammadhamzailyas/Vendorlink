import React from "react";
import { Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { Button, Input, Textarea } from "../ui";

const MilestoneEditor = ({ milestones, onChange, onAdd, onRemove, disabled, errors = [] }) => (
  <div className="space-y-6">
    {milestones.map((ms, idx) => (
      <div
        key={idx}
        className="group relative p-6 rounded-xl bg-muted/20 border border-border/60 hover:border-foreground/20 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-foreground text-background text-[10px] font-black">
              {String(idx + 1).padStart(2, '0')}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Project Milestone</h4>
          </div>
          {milestones.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onRemove(idx)}
              disabled={disabled}
              className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-3">
            <Input
              label="Milestone Title"
              placeholder="e.g., Initial Wireframes & Architecture"
              value={ms.title}
              onChange={(e) => onChange(idx, "title", e.target.value)}
              disabled={disabled}
              error={errors[idx]?.title}
            />
          </div>
          <div className="md:col-span-1">
            <Input
              label="Amount ($)"
              type="number"
              placeholder="0.00"
              value={ms.amount}
              onChange={(e) => onChange(idx, "amount", e.target.value)}
              disabled={disabled}
              error={errors[idx]?.amount}
              className="font-mono"
            />
          </div>
          <div className="md:col-span-4">
            <Textarea
              label="Deliverables & Acceptance Criteria"
              placeholder="List specific outputs for this milestone..."
              rows={3}
              value={ms.description}
              onChange={(e) => onChange(idx, "description", e.target.value)}
              disabled={disabled}
              error={errors[idx]?.description}
            />
          </div>
        </div>

        {errors[idx]?.general && (
          <div className="mt-4 flex items-center gap-2 text-destructive text-[10px] font-bold uppercase tracking-widest">
            <WarningCircle size={14} weight="fill" />
            {errors[idx].general}
          </div>
        )}
      </div>
    ))}

    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onAdd}
      disabled={disabled}
      className="w-full h-14 border-dashed border-2 border-border/60 rounded-xl font-semibold uppercase tracking-widest text-[10px] hover:border-foreground/30 hover:bg-muted/30 group"
    >
      <div className="flex items-center justify-center gap-2">
        
        Add New Milestone
      </div>
    </Button>
  </div>
);

export default MilestoneEditor;

