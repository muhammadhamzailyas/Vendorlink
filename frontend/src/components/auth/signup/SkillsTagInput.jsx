import React from "react";
import { Button, Input } from "../../ui";

const SkillsTagInput = ({ skills, skillsInput, onChange, onKeyDown, onBlur, onRemove }) => (
  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
      Skills / Expertise Tags
    </p>
    <div className="flex flex-wrap gap-2 mb-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-1 text-xs text-[var(--foreground)]/80"
        >
          {skill}
          <Button
            type="button"
            onClick={() => onRemove(skill)}
            variant="ghost"
            size="xs"
            className="h-4 w-4 p-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            x
          </Button>
        </span>
      ))}
    </div>
    <Input
      className="h-10 rounded-lg border-[var(--border)] bg-[var(--card)] font-medium"
      placeholder="Type a skill and press Enter"
      value={skillsInput}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    />
  </div>
);

export default SkillsTagInput;
