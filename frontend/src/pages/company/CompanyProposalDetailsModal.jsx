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
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  ShieldCheck,
  TrendUp
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { 
  Dialog, 
  Button, 
  Badge,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
import { cn } from "@/lib/cn";

const CompanyProposalDetailsModal = ({ open, proposal, onX, onAccept, onReject, isApproved }) => {
  if (!open || !proposal) return null;

  const DetailItem = ({ label, value, icon: Icon, className }) => (
    <div className={cn("space-y-2", className)}>
      <DetailLabel className="flex items-center gap-2">
        {Icon && <Icon size={12} weight="bold" />}
        {label}
      </DetailLabel>
      <div className="text-sm font-bold text-foreground bg-muted/30 px-4 py-3 rounded-xl border border-border/50 min-h-[44px] flex items-center">
        {value || "N/A"}
      </div>
    </div>
  );

  const DetailLabel = ({ children, className }) => (
    <span className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground", className)}>
        {children}
    </span>
  );

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-6xl" aria-describedby="proposal-details-description">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={32} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
              Vendor Submission Brief
            </Dialog.Title>
            <Dialog.Description id="proposal-details-description" className="sr-only">
              In-depth view of the vendor proposal and terms.
            </Dialog.Description>
            <div className="flex items-center justify-center gap-2 mt-2">
                <StatusChip status={proposal.status} size="small" />
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-border/60">
                    BID ID: #{proposal._id?.slice(-6).toUpperCase()}
                </Badge>
            </div>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[70vh] overflow-y-auto space-y-10">
        <FormSection
          title="Engagement Overview"
          icon={<Briefcase className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <FormFieldGrid>
            <DetailItem 
                label="Assigned Task" 
                value={proposal.taskId?.title} 
                className="md:col-span-2"
            />
            <DetailItem 
                label="Expert Vendor" 
                value={proposal.vendorId?.companyName || proposal.vendorId?.username} 
                icon={User}
            />
            <DetailItem 
                label="Proposed Budget" 
                value={`$ ${proposal.bidAmount?.toLocaleString()}`} 
                icon={CurrencyDollar}
            />
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title="Strategic Approach"
          icon={<ListChecks className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <div className="space-y-6">
            <div className="space-y-2">
                <DetailLabel>Solution Narrative</DetailLabel>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 bg-card p-6 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-[120px]">
                    {proposal.proposalText}
                </div>
            </div>

            <div className="space-y-2">
                <DetailLabel>Matching Expertise</DetailLabel>
                <div className="text-sm font-medium leading-relaxed text-foreground/80 bg-card p-6 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-[80px]">
                    {proposal.experience || "No specific experience provided."}
                </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Capabilities & Delivery"
          icon={<Tag className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
            <FormFieldGrid>
                <div className="space-y-4">
                    <DetailLabel>Technical Stack</DetailLabel>
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
                <DetailItem 
                    label="Project Timeline" 
                    value={dayjs(proposal.proposedDeadline).format("MMM DD, YYYY")} 
                    icon={Calendar}
                />
            </FormFieldGrid>
        </FormSection>

        {proposal.milestones?.length > 0 && (
            <FormSection
                title="Milestone roadmap"
                icon={<TrendUp className="h-4 w-4" />}
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Allocation</p>
                                <p className="text-sm font-black text-foreground">${m.amount?.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </FormSection>
        )}

        {proposal.portfolioLinks?.filter(l => l)?.length > 0 && (
            <FormSection
                title="Proof of Work"
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
                            <LinkIcon size={14} className="text-muted-foreground group-hover:text-primary" />
                            <span className="truncate flex-1">{link.replace(/^https?:\/\//, '')}</span>
                        </a>
                    ))}
                </div>
            </FormSection>
        )}
      </Dialog.Body>

      <div className="flex items-center justify-between px-8 py-8 border-t border-border/50 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            onClick={onX}
            className="font-black uppercase tracking-widest text-[10px] h-12 px-8"
          >
            Close Brief
          </Button>

          {proposal.status === 'submitted' && (
              <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => onReject(proposal)}
                    disabled={!isApproved}
                    className="font-black uppercase tracking-widest text-[10px] h-12 px-8 text-error hover:bg-error/10"
                  >
                    <XCircle className="mr-2 h-4 w-4" weight="bold" />
                    Reject Bid
                  </Button>
                  <Button
                    onClick={() => onAccept(proposal)}
                    disabled={!isApproved}
                    className="font-black uppercase tracking-widest text-[10px] h-12 px-10 shadow-lg"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" weight="bold" />
                    Hire Vendor
                  </Button>
              </div>
          )}
      </div>
    </Dialog>
  );
};

export default CompanyProposalDetailsModal;
