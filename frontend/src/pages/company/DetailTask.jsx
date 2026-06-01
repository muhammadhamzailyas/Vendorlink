import React from "react";
import StatusChip from "@/components/shared/StatusChip";
import { DetailMetaGrid, DetailMetaItem, DetailSection } from "@/components/shared/DetailLayout";

const DetailTask = ({ task, proposals, formatDate }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <DetailSection
          title="Task Summary"
          description="Core delivery scope, timeline, and proposal volume for this posting."
          actions={<StatusChip status={task.status || "open"} size="medium" />}
        >
          <p className="text-sm leading-6 text-foreground/80">{task.description || "No task description provided."}</p>

          <DetailMetaGrid>
            <DetailMetaItem label="Budget" value={`$${(task.budget || 0).toLocaleString()}`} />
            <DetailMetaItem label="Deadline" value={task.deadline ? formatDate(task.deadline) : "N/A"} />
            <DetailMetaItem label="Category" value={task.category || "N/A"} />
            <DetailMetaItem label="Proposals" value={String(proposals.length)} />
          </DetailMetaGrid>
        </DetailSection>

        <DetailSection title="Requirements" description="Requested capabilities and delivery constraints.">
          <div className="rounded-xl border border-border bg-muted/70 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/80">{task.requirements || "No explicit requirements provided."}</p>
          </div>
        </DetailSection>
      </div>
    </div>
  );
};

export default DetailTask;





