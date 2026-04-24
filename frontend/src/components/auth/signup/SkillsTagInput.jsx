import React from "react";
import { Button, Input } from "../../ui";

const SkillsTagInput = ({ skills, skillsInput, onChange, onKeyDown, onBlur, onRemove }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      Skills / Expertise Tags
    </p>
    <div className="flex flex-wrap gap-2 mb-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground/80"
        >
          {skill}
          <Button
            type="button"
            onClick={() => onRemove(skill)}
            variant="ghost"
            size="xs"
            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
          >
            x
          </Button>
        </span>
      ))}
    </div>
    <Input
      className="h-10 rounded-lg border-border bg-card font-medium"
      placeholder="Type a skill and press Enter"
      value={skillsInput}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  </div>
);

export default SkillsTagInput;



