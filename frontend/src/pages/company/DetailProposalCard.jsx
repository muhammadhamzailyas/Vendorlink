import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User as Person, 
  Clock as Clock, 
  CurrencyDollar, 
  Lightning as Bolt, 
  Percent, 
  CaretDown as CaretDown, 
  CaretUp as CaretUp, 
  Check, 
  X as X, 
  ChatCircleText as Chat,
  Signature as Contract
} from "@phosphor-icons/react";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import { Button, Card } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";

const DetailProposalCard = ({
  proposal,
  task,
  onAccept,
  onReject,
  formatDate,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { isApproved } = useApprovalStatus();

  const budgetUsage = ((proposal.bidAmount / task.budget) * 100).toFixed(1);

  return (
    <Card
      className={`h-full ${proposal.status === "accepted" ? "border-ring/50 bg-muted/20" : "border-border"}`}
    >
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="flex items-center text-base font-bold text-foreground">
              <Person className="mr-2 text-foreground" />
              {proposal.vendorId?.username}
            </h3>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-tight text-muted-foreground/60">
              Submitted {formatDate(proposal.submittedAt)}
            </p>
          </div>
          <StatusChip status={proposal.status || "submitted"} size="medium" />
        </div>
      </Card.Header>

      <Card.Content>
        <div className="grid grid-cols-1 gap-3 text-sm text-foreground/80 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bid Amount</span>
            <p className="flex items-center text-sm font-bold text-foreground">
              <CurrencyDollar className="h-4 w-4 mr-1.5 text-success" />
              ${proposal.bidAmount?.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proposed Deadline</span>
            <p className="flex items-center text-sm font-bold text-foreground">
              <Clock className="mr-1.5 h-4 w-4 text-foreground" />
              {formatDate(proposal.proposedDeadline)}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Availability</span>
            <p className="flex items-center text-sm font-bold text-foreground">
              <Bolt className="mr-1.5 h-4 w-4 text-warning" />
              {proposal.availability}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Budget Utilization</span>
            <p className="flex items-center text-sm font-bold text-foreground">
              <Percent className="mr-1.5 h-4 w-4 text-info" />
              {budgetUsage}%
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 rounded-xl border border-border bg-muted/70 p-4 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">Proposal Narrative</h4>
            <p className="text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {proposal.proposalText}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-9 font-bold uppercase tracking-tight text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {expanded ? <CaretUp className="mr-1.5 h-4 w-4" /> : <CaretDown className="mr-1.5 h-4 w-4" />}
            {expanded ? "Show Less" : "Show More"}
          </Button>

          <div className="grow" />

          {proposal.status === "submitted" && (
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => onReject(proposal._id)}
                disabled={!isApproved}
                className="font-bold uppercase tracking-tight"
                title={!isApproved ? "Please wait for admin approval to reject proposals" : ""}
              >
                <X className="mr-1.5 h-4 w-4" />
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept(proposal._id)}
                disabled={!isApproved}
                className="font-bold uppercase tracking-tight"
                title={!isApproved ? "Please wait for admin approval to accept proposals" : ""}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Accept
              </Button>
            </div>
          )}

          {proposal.status === "accepted" && (
            <div className="flex gap-2">
              <Button 
                variant="ghost"
                size="sm" 
                className="font-bold uppercase tracking-tight"
                onClick={() => navigate(`/company/chat?taskId=${task._id}`)}
              >
                <Chat className="mr-1.5 h-4 w-4" />
                Chat
              </Button>
              <Button 
                variant="primary"
                size="sm" 
                className="font-bold uppercase tracking-tight"
                onClick={() => navigate(`/company/contracts/create?proposalId=${proposal._id}`)}
              >
                <Contract className="mr-1.5 h-4 w-4" />
                Create Contract
              </Button>
            </div>
          )}
        </div>

        {proposal.status === "accepted" && (
          <div className="mt-4 flex items-center justify-center rounded-lg bg-muted/40 py-2 border border-ring/10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
              Accepted on {formatDate(proposal.acceptedAt)}
            </span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default DetailProposalCard;




