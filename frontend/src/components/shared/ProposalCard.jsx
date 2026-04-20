import React, { useState } from "react";
import { User as Person, Clock as Clock, CurrencyDollar, CaretDown as CaretDown, CaretUp as CaretUp, Check, X as X } from "@phosphor-icons/react";
import StatusChip from "./StatusChip";
import { useApprovalStatus } from "../../lib/useApprovalStatus";
import { Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui";

/**
 * Reusable ProposalCard component for displaying proposal information
 */
const ProposalCard = ({ 
  proposal, 
  onAccept, 
  onReject, 
  formatDate,
  showActions = true 
}) => {
  const { isApproved } = useApprovalStatus();
  const [expanded, setExpanded] = useState(false);

  const handleAccept = () => {
    if (onAccept) {
      onAccept(proposal._id);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(proposal._id);
    }
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card
        className={`transition-all duration-300 hover:shadow-md bg-[var(--card)] border-[var(--border)] ${
          proposal.status === "accepted" ? "ring-2 ring-[var(--success)]/20" : ""
        }`}
      >
        <Card.Header className="pb-3 flex flex-row items-start justify-between gap-4 space-y-0 sm:px-6 px-5 pt-5 sm:pt-6 border-b-0">
          <div className="min-w-0">
            <Card.Title className="truncate text-lg font-black tracking-tight text-[var(--foreground)] uppercase">
              {proposal.taskId?.title || "Task"}
            </Card.Title>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
              <Person className="h-3.5 w-3.5" />
              <span>{proposal.vendorId?.username || proposal.vendorId?.companyName || "Vendor"}</span>
            </div>
          </div>
          <StatusChip status={proposal.status} className="shrink-0" />
        </Card.Header>

        <Card.Content className="pb-4 sm:px-6 px-5">
          <div className="mb-5 flex flex-wrap gap-6 text-[var(--foreground)]">
            {proposal.bidAmount && (
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Bid Amount</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                  <CurrencyDollar className="h-4 w-4 text-[var(--success)]" />
                  <span>PKR {proposal.bidAmount?.toLocaleString()}</span>
                </div>
              </div>
            )}
            {proposal.deadline && formatDate && (
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Deadline</span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                  <Clock className="h-4 w-4 text-[var(--info)]" />
                  <span>{formatDate(proposal.deadline)}</span>
                </div>
              </div>
            )}
          </div>

          {proposal.proposalText && (
            <CollapsibleContent className="animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 shadow-inner">
                <p className="text-sm font-medium leading-relaxed text-[var(--foreground)] italic">"{proposal.proposalText}"</p>
              </div>
            </CollapsibleContent>
          )}
        </Card.Content>

        {showActions && (
          <Card.Footer className="flex items-center justify-between gap-4 pt-4 pb-5 sm:px-6 px-5 border-t border-[var(--border)] bg-[var(--muted)]/30">
            {proposal.proposalText ? (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="font-bold uppercase tracking-tight text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {expanded ? <CaretUp className="mr-1.5 h-4 w-4" /> : <CaretDown className="mr-1.5 h-4 w-4" />}
                  {expanded ? "Show Less" : "View Proposal"}
                </Button>
              </CollapsibleTrigger>
            ) : <div />}

          {proposal.status === "submitted" && (
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleReject}
                disabled={!isApproved}
                className="font-bold uppercase tracking-tight text-[11px] h-9"
                title={!isApproved ? "Please wait for admin approval to reject proposals" : ""}
              >
                <X className="mr-1.5 h-4 w-4" />
                Reject
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAccept}
                disabled={!isApproved}
                className="font-bold uppercase tracking-tight text-[11px] h-9"
                title={!isApproved ? "Please wait for admin approval to accept proposals" : ""}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Accept
              </Button>
            </div>
          )}
        </Card.Footer>
      )}
    </Card>
    </Collapsible>
  );
};
export default ProposalCard;
