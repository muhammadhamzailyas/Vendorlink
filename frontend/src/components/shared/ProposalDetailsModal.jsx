import React from "react";
import { 
  ClipboardText as Assignment, 
  Briefcase,
  ListChecks,
  Tag,
  CurrencyDollar,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  TrendUp,
  Link as LinkIcon
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { 
  Dialog, 
  Button, 
  Badge,
  DetailItem,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
import { formatCategory } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

const ProposalDetailsModal = ({ 
  open, 
  proposal, 
  onX, 
  onAccept, 
  onReject, 
  isApproved, 
  isVendor = false 
}) => {
  if (!open || !proposal) return null;

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-6xl" aria-describedby="proposal-details-description">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={isVendor ? "p-3 rounded-full bg-muted/50 text-foreground" : "p-3 rounded-full bg-primary/10 text-primary"}>
            {isVendor ? <Assignment size={32} weight="bold" /> : <ShieldCheck size={32} weight="bold" />}
          </div>
          <div className="space-y-1.5">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
              {isVendor ? "Proposal Details" : "Vendor Submission Brief"}
            </Dialog.Title>
            <Dialog.Description id="proposal-details-description" className="sr-only">
              {isVendor ? "Detailed breakdown of your proposal for this task" : "In-depth view of the vendor proposal and terms."}
            </Dialog.Description>
            <div className="flex items-center justify-center gap-2 mt-2">
                <StatusChip status={proposal.status} size="small" />
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-border/60">
                    {isVendor ? `ID: #${proposal._id?.slice(-6).toUpperCase()}` : `BID ID: #${proposal._id?.slice(-6).toUpperCase()}`}
                </Badge>
            </div>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[70vh] overflow-y-auto space-y-10">
        <FormSection
          title={isVendor ? "Task Information" : "Engagement Overview"}
          icon={<Briefcase className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <FormFieldGrid>
            <DetailItem 
                label={isVendor ? "Task Title" : "Assigned Task"} 
                value={proposal.taskId?.title} 
                className="md:col-span-2"
            />
            <DetailItem 
                label={isVendor ? "Client" : "Expert Vendor"} 
                value={isVendor 
                    ? (proposal.companyId?.companyName || proposal.companyId?.fullName || proposal.companyId?.email) 
                    : (proposal.vendorId?.companyName || proposal.vendorId?.fullName || proposal.vendorId?.email)} 
                icon={User}
            />
            <DetailItem 
                label={isVendor ? "Bid Amount" : "Proposed Budget"} 
                value={formatCurrency(proposal.bidAmount)} 
                icon={CurrencyDollar}
            />
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title={isVendor ? "Strategic Statement" : "Strategic Approach"}
          icon={<ListChecks className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <div className="space-y-6">
            <div className="space-y-2">
                <DetailItem
                    label={isVendor ? "My Approach" : "Solution Narrative"}
                    value={proposal.proposalText}
                    className="md:col-span-2"
                />
            </div>

            <div className="space-y-2">
                <DetailItem
                    label={isVendor ? "Relevant Experience" : "Matching Expertise"}
                    value={proposal.experience}
                    className="md:col-span-2"
                />
            </div>
          </div>
        </FormSection>

        <FormSection
          title={isVendor ? "Skills & Availability" : "Capabilities & Delivery"}
          icon={<Tag className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
            <FormFieldGrid>
                <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {isVendor ? "Technical stack" : "Technical Stack"}
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                        {proposal.skills?.length > 0 ? (
                            proposal.skills.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="font-black text-[9px] py-1.5 px-4 rounded-lg bg-foreground text-background border-none uppercase tracking-widest">
                                    {skill}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground italic">No skills listed</span>
                        )}
                    </div>
                </div>
                {isVendor ? (
                    <DetailItem 
                        label="Earliest Availability" 
                        value={proposal.availability?.replace(/-/g, ' ').toUpperCase()} 
                        icon={Clock}
                    />
                ) : (
                    <DetailItem 
                        label="Project Timeline" 
                        value={dayjs(proposal.proposedDeadline).format("MMM DD, YYYY")} 
                        icon={Calendar}
                    />
                )}
            </FormFieldGrid>
        </FormSection>

        {proposal.milestones?.length > 0 && (
            <FormSection
                title={isVendor ? "Milestone breakdown" : "Milestone roadmap"}
                icon={isVendor ? <Calendar className="h-4 w-4" /> : <TrendUp className="h-4 w-4" />}
                className="border-none p-0 shadow-none"
            >
                <div className="space-y-3 mt-4">
                    {proposal.milestones.map((m, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border/40 bg-muted/10 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Phase {i+1}</p>
                                <p className="text-sm font-bold text-foreground truncate">{m.title}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{isVendor ? "Budget" : "Allocation"}</p>
                                <p className="text-sm font-black text-foreground">{formatCurrency(m.amount)}</p>
                            </div>
                            {isVendor && (
                                <div className="text-right min-w-[100px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Deadline</p>
                                    <p className="text-xs font-bold text-foreground">{dayjs(m.deadline).format("MMM DD, YYYY")}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </FormSection>
        )}

        {proposal.portfolioLinks?.filter(l => l)?.length > 0 && (
            <FormSection
                title={isVendor ? "Portfolio & references" : "Proof of Work"}
                icon={<LinkIcon className="h-4 w-4" />}
                className="border-none p-0 shadow-none"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {proposal.portfolioLinks.filter(l => l).map((link, i) => (
                        <a 
                            key={i} 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors flex items-center gap-3 group text-xs font-bold text-foreground/70"
                        >
                            {isVendor ? (
                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <LinkIcon size={14} />
                                </div>
                            ) : (
                                <LinkIcon size={14} className="text-muted-foreground group-hover:text-primary" />
                            )}
                            <span className="truncate flex-1">{link.replace(/^https?:\/\//, '')}</span>
                        </a>
                    ))}
                </div>
            </FormSection>
        )}
      </Dialog.Body>

      <div className={isVendor ? "grid-cols-1 grid px-8 py-8 border-t border-border/50 bg-muted/20" : "flex items-center justify-between px-8 py-8 border-t border-border/50 bg-muted/20"}>
          <Button
            type="button"
            variant={isVendor ? "secondary" : "ghost"}
            onClick={onX}
            className={isVendor ? "font-semibold uppercase tracking-widest text-[10px] h-12 w-full max-w-xs mx-auto rounded-xl" : "font-semibold uppercase tracking-widest text-[10px] h-12 px-8"}
          >
            {isVendor ? "Close Details" : "Close Brief"}
          </Button>

          {!isVendor && proposal.status === 'submitted' && (
              <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => onReject(proposal)}
                    disabled={!isApproved}
                    className="font-black uppercase tracking-widest text-[10px] h-12 px-8 text-error hover:bg-error/10"
                  >
                    Reject Bid
                  </Button>
                  <Button
                    onClick={() => onAccept(proposal)}
                    disabled={!isApproved}
                    className="font-black uppercase tracking-widest text-[10px] h-12 px-10 shadow-lg"
                  >
                    Hire Vendor
                  </Button>
              </div>
          )}
      </div>
    </Dialog>
  );
};

export default ProposalDetailsModal;
