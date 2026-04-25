import React from "react";
import { 
  ClipboardText as Assignment, 
  X as CloseIcon, 
  Briefcase,
  ListChecks,
  Tag,
  CurrencyDollar,
  Calendar,
  Clock,
  User,
  CheckCircle,
  WarningCircle,
  Link as LinkIcon
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

const DetailLabel = ({ children, className }) => (
    <span className={cn("text-[10px] font-black uppercase tracking-widest text-muted-foreground", className)}>
        {children}
    </span>
);

const ProposalDetailsModal = ({ open, proposal, onX }) => {
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

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-6xl" aria-describedby="proposal-details-description">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-muted/50 text-foreground">
            <Assignment size={32} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
              Proposal Details
            </Dialog.Title>
            <Dialog.Description id="proposal-details-description" className="sr-only">
              Detailed breakdown of your proposal for this task
            </Dialog.Description>
            <div className="flex items-center justify-center gap-2 mt-2">
                <StatusChip status={proposal.status} size="small" />
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-border/60">
                    ID: #{proposal._id?.slice(-6).toUpperCase()}
                </Badge>
            </div>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[70vh] overflow-y-auto space-y-10">
        <FormSection
          title="Task Information"
          icon={<Briefcase className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <FormFieldGrid>
            <DetailItem 
                label="Task Title" 
                value={proposal.taskId?.title} 
                className="md:col-span-2"
            />
            <DetailItem 
                label="Client" 
                value={proposal.companyId?.companyName || proposal.companyId?.username} 
                icon={User}
            />
            <DetailItem 
                label="Bid Amount" 
                value={`$ ${proposal.bidAmount?.toLocaleString()}`} 
                icon={CurrencyDollar}
            />
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title="Strategic Statement"
          icon={<ListChecks className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <div className="space-y-6">
            <div className="space-y-2">
                <DetailLabel>My Approach</DetailLabel>
                <div className="text-xs font-medium leading-relaxed text-foreground/80 bg-card p-6 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-[120px]">
                    {proposal.proposalText}
                </div>
            </div>

            <div className="space-y-2">
                <DetailLabel>Relevant Experience</DetailLabel>
                <div className="text-xs font-medium leading-relaxed text-foreground/80 bg-card p-6 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-[80px]">
                    {proposal.experience || "No specific experience provided."}
                </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Skills & Availability"
          icon={<Tag className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
            <FormFieldGrid>
                <div className="space-y-4">
                    <DetailLabel>Technical stack</DetailLabel>
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
                    label="Earliest Availability" 
                    value={proposal.availability?.replace(/-/g, ' ').toUpperCase()} 
                    icon={Clock}
                />
            </FormFieldGrid>
        </FormSection>

        {proposal.milestones?.length > 0 && (
            <FormSection
                title="Milestone breakdown"
                icon={<Calendar className="h-4 w-4" />}
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Budget</p>
                                <p className="text-sm font-black text-foreground">${m.amount?.toLocaleString()}</p>
                            </div>
                            <div className="text-right min-w-[100px]">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Deadline</p>
                                <p className="text-xs font-bold text-foreground">{dayjs(m.deadline).format("MMM DD, YYYY")}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </FormSection>
        )}

        {proposal.portfolioLinks?.filter(l => l)?.length > 0 && (
            <FormSection
                title="Portfolio & references"
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
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <LinkIcon size={14} />
                            </div>
                            <span className="truncate flex-1">{link.replace(/^https?:\/\//, '')}</span>
                        </a>
                    ))}
                </div>
            </FormSection>
        )}
      </Dialog.Body>

      <div className="flex items-center justify-center px-8 py-8 border-t border-border/50 bg-muted/20">
          <Button
            type="button"
            variant="secondary"
            onClick={onX}
            className="font-black uppercase tracking-widest text-[10px] h-12 w-full max-w-xs rounded-xl"
          >
            Close Details
          </Button>
      </div>
    </Dialog>
  );
};

export default ProposalDetailsModal;
