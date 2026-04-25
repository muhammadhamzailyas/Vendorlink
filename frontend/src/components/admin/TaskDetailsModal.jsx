import React from "react";
import dayjs from "dayjs";
import { 
  ClipboardText as Assignment, 
  Buildings, 
  Calendar, 
  CurrencyDollar, 
  Stack, 
  FileText,
  User,
  Clock
} from "@phosphor-icons/react";
import { Dialog, Button, DetailField, Badge } from "../ui";
import StatusChip from "../shared/StatusChip";

const TaskDetailsModal = ({ open, task, onX }) => {
  if (!open || !task) return null;

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 opacity-70">
      <Icon size={14} weight="bold" />
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h4>
    </div>
  );

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-2xl">
      <Dialog.Header onX={onX} className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-foreground">
            <Assignment size={32} weight="bold" />
          </div>
          <div className="space-y-1.5 w-full text-center">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase text-center w-full">
              {task.title}
            </Dialog.Title>
            <div className="flex items-center justify-center gap-2">
               <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{task.category}</Badge>
               <StatusChip status={task.status} size="small" />
            </div>
            <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center w-full mt-2">
              Task Monitoring Details
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-10 pb-10 bg-card space-y-8">
        {/* Core Information Section */}
        <section>
          <SectionHeader icon={Assignment} title="General Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            <DetailField 
              label="Budget" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" 
              valueClassName="text-sm font-bold text-foreground"
            >
              <div className="flex items-center gap-1">
                <CurrencyDollar size={14} weight="bold" className="text-success" />
                {task.budget?.toLocaleString()} PKR
              </div>
            </DetailField>
            <DetailField 
              label="Deadline" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" 
              valueClassName="text-sm font-bold text-foreground"
            >
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {dayjs(task.deadline).format("MMM DD, YYYY")}
              </div>
            </DetailField>
            <DetailField 
              label="Category" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {task.category}
            </DetailField>
            <DetailField 
              label="Created At" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {dayjs(task.createdAt).format("MMM DD, YYYY")}
            </DetailField>
          </div>
        </section>

        {/* Company & Engagement Section */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={Buildings} title="Associated Entities" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            <DetailField 
              label="Company" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {task.companyId?.companyName || task.companyId?.username || "N/A"}
            </DetailField>
            <DetailField 
              label="Selected Vendor" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5" 
              valueClassName="text-sm font-bold text-foreground"
            >
              {task.selectedVendor?.username || task.selectedVendor?.email || "No vendor selected"}
            </DetailField>
          </div>
        </section>

        {/* Requirements & Description */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={FileText} title="Task Requirements" />
          <div className="space-y-6">
            <DetailField
              label="Overview"
              colSpan={2}
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2"
              valueClassName="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-4 rounded-xl border border-border/50"
            >
              {task.description || "No description provided."}
            </DetailField>

            <DetailField
              label="Key Requirements"
              colSpan={2}
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2"
              valueClassName="text-xs font-medium leading-relaxed text-foreground"
            >
              <div className="flex flex-wrap gap-2">
                {Array.isArray(task.requirements) ? task.requirements.map((req, i) => (
                    <Badge key={i} variant="outline" className="font-bold text-[10px] py-1 px-3 border-border/60">{req}</Badge>
                )) : task.requirements || "None"}
              </div>
            </DetailField>
          </div>
        </section>

        <div className="flex justify-center pt-4">
          <Button 
            variant="secondary" 
            onClick={onX} 
            className="w-full font-bold uppercase tracking-tight text-[11px] h-12 rounded-xl"
          >
            Close
          </Button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
};

export default TaskDetailsModal;
