import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User as Person, 
  Clock, 
  CurrencyDollar, 
  Lightning as Bolt, 
  Percent, 
  CaretDown, 
  CaretUp, 
  Check, 
  X, 
  ChatCircleText as Chat,
  Signature as ContractIcon,
  Tag,
  Link as LinkIcon,
  Briefcase
} from "@phosphor-icons/react";
import { useApprovalStatus } from "@/lib/useApprovalStatus";
import { Button, Card, Badge } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import { cn } from "@/lib/cn";

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

  const Label = ({ children, className }) => (
    <span className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground", className)}>
        {children}
    </span>
  );

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        proposal.status === "accepted" 
            ? "border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/20" 
            : "border-border hover:border-border-hover hover:shadow-soft"
      )}
    >
      <Card.Header className="pb-4 border-b border-border/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-foreground font-black text-xs">
                    {(proposal.vendorId?.fullName || proposal.vendorId?.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <h3 className="text-base font-black tracking-tight text-foreground uppercase">
                    {proposal.vendorId?.fullName || proposal.vendorId?.email || "Verified Vendor"}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/70">
                    Submitted {formatDate(proposal.submittedAt)}
                    </p>
                </div>
            </div>
          </div>
          <StatusChip status={proposal.status || "submitted"} size="medium" />
        </div>
      </Card.Header>

      <Card.Content className="pt-6">
        <div className="grid grid-cols-1 gap-6 text-sm text-foreground/80 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
                <CurrencyDollar size={12} weight="bold" className="text-success" />
                Bid Amount
            </Label>
            <p className="text-sm font-black text-foreground">
              ${proposal.bidAmount?.toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
                <Clock size={12} weight="bold" />
                Proposed Deadline
            </Label>
            <p className="text-sm font-bold text-foreground">
              {formatDate(proposal.proposedDeadline)}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
                <Bolt size={12} weight="bold" className="text-warning" />
                Earliest Availability
            </Label>
            <p className="text-sm font-bold text-foreground uppercase tracking-tight">
              {proposal.availability?.replace(/-/g, ' ')}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-1.5">
                <Percent size={12} weight="bold" className="text-info" />
                Budget Fit
            </Label>
            <div className="flex items-center gap-2">
                <p className="text-sm font-black text-foreground">{budgetUsage}%</p>
                <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div 
                        className={cn(
                            "h-full rounded-full transition-all",
                            parseFloat(budgetUsage) <= 100 ? "bg-success" : "bg-error"
                        )} 
                        style={{ width: `${Math.min(parseFloat(budgetUsage), 100)}%` }}
                    />
                </div>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <Briefcase size={12} weight="bold" />
                    Strategic Approach
                </Label>
                <div className="rounded-xl border border-border/60 bg-card p-5 text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {proposal.proposalText}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <Tag size={12} weight="bold" />
                    Relevant Experience
                </Label>
                <div className="rounded-xl border border-border/60 bg-card p-5 text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {proposal.experience || "No specific experience provided."}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <Tag size={12} weight="bold" />
                    Technical Stack
                </Label>
                <div className="flex flex-wrap gap-2 pt-1">
                    {proposal.skills?.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="font-black text-[9px] py-1.5 px-4 rounded-lg bg-foreground text-background border-none uppercase tracking-widest">
                            {skill}
                        </Badge>
                    ))}
                </div>
            </div>

            {proposal.portfolioLinks?.filter(l => l)?.length > 0 && (
                <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                        <LinkIcon size={12} weight="bold" />
                        Portfolio References
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                        {proposal.portfolioLinks.filter(l => l).map((link, i) => (
                            <a 
                                key={i} 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors flex items-center gap-3 group text-xs font-bold text-foreground/70"
                            >
                                <LinkIcon size={14} className="text-muted-foreground group-hover:text-primary" />
                                <span className="truncate flex-1">{link.replace(/^https?:\/\//, '')}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Minimize Brief" : "Read Full Proposal"}
          </Button>

          <div className="grow" />

          {proposal.status === "submitted" && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject(proposal._id)}
                disabled={!isApproved}
                className="h-10 px-5 font-black uppercase tracking-widest text-[10px] text-error hover:bg-error/10"
              >
                
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept(proposal._id)}
                disabled={!isApproved}
                className="h-10 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
              >
                
                Accept Bid
              </Button>
            </div>
          )}

          {proposal.status === "accepted" && (
            <div className="grid-cols-2 grid gap-3">
              <Button 
                variant="secondary"
                size="sm" 
                className="w-full h-10 px-6 font-semibold uppercase tracking-widest text-[10px]"
                onClick={() => navigate(`/company/messages?userId=${proposal.vendorId?._id}`)}
              >
                
                Chat
              </Button>
              <Button 
                size="sm" 
                className="w-full h-10 px-8 font-semibold uppercase tracking-widest text-[10px] shadow-lg"
                onClick={() => navigate(`/company/contract/create?proposalId=${proposal._id}`)}
              >
                
                Create Contract
              </Button></div>
          )}
        </div>

        {proposal.status === "accepted" && (
          <div className="mt-6 flex items-center justify-center rounded-xl bg-primary/10 py-3 border border-primary/20">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <Check size={14} weight="bold" />
              Officially Accepted on {formatDate(proposal.acceptedAt)}
            </span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default DetailProposalCard;





