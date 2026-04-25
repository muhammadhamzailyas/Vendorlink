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
  Info
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { 
  Dialog, 
  Button, 
  Badge,
  PageTransition
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
import { cn } from "@/lib/cn";

const TaskDetailsModal = ({ open, task, onX }) => {
  if (!open || !task) return null;

  const DetailItem = ({ label, value, icon: Icon, className }) => (
    <div className={cn("space-y-2", className)}>
      <DetailLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
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
    <Dialog open={open} onX={onX} className="sm:max-w-3xl">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-full bg-muted/50 text-foreground">
            <Assignment size={32} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase">
              Task Specifications
            </Dialog.Title>
            <div className="flex items-center justify-center gap-2 mt-2">
                <StatusChip status={task.status} size="small" />
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-border/60">
                    {task.category}
                </Badge>
            </div>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[70vh] overflow-y-auto space-y-10">
        <FormSection
          title="General Information"
          icon={<Briefcase className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <FormFieldGrid>
            <DetailItem 
                label="Task Title" 
                value={task.title} 
                className="md:col-span-2"
            />
            <DetailItem 
                label="Category" 
                value={task.category?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 
            />
            <DetailItem 
                label="Priority Level" 
                value={task.priority?.toUpperCase()} 
            />
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title="Detailed Brief"
          icon={<ListChecks className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <div className="space-y-6">
            <div className="space-y-2">
                <DetailLabel>Project Description</DetailLabel>
                <div className="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-5 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-[120px]">
                    {task.description}
                </div>
            </div>

            <div className="space-y-2">
                <DetailLabel>Technical Requirements</DetailLabel>
                <div className="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-5 rounded-2xl border border-border/50 whitespace-pre-wrap min-h-[80px]">
                    {task.requirements}
                </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Skills & Expertise"
          icon={<Tag className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
            <div className="flex flex-wrap gap-2 pt-2">
                {task.skills?.length > 0 ? (
                    task.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="font-black text-[10px] py-1.5 px-4 rounded-lg bg-foreground text-background border-none uppercase tracking-widest">
                            {skill}
                        </Badge>
                    ))
                ) : (
                    <span className="text-sm text-muted-foreground italic">No specific skills listed</span>
                )}
            </div>
        </FormSection>

        <FormSection
          title="Timeline & Budget"
          icon={<CurrencyDollar className="h-4 w-4" />}
          className="border-none p-0 shadow-none"
        >
          <FormFieldGrid className="sm:grid-cols-3">
            <DetailItem 
                label="Payment Type" 
                value={task.taskType?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 
            />
            <DetailItem 
                label="Budget (USD)" 
                value={`$ ${task.budget?.toLocaleString()}`} 
                icon={CurrencyDollar}
            />
            <DetailItem 
                label="Deadline" 
                value={dayjs(task.deadline).format("MMM DD, YYYY")} 
                icon={Calendar}
            />
          </FormFieldGrid>
        </FormSection>
      </Dialog.Body>

      <div className="flex items-center justify-center px-8 py-6 border-t border-border/50 bg-muted/20">
          <Button
            type="button"
            variant="secondary"
            onClick={onX}
            className="font-black uppercase tracking-widest text-[10px] h-12 w-full max-w-xs rounded-xl"
          >
            Close Specifications
          </Button>
      </div>
    </Dialog>
  );
};

export default TaskDetailsModal;
