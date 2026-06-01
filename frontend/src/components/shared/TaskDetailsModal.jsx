import React from "react";
import { 
  ClipboardText as Assignment, 
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { 
  Dialog, 
  Button, 
  Badge,
  DetailItem,
  DetailField
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
import { formatCategory } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

const TaskDetailsModal = ({ open, task, onX, isAdmin = false }) => {
  if (!open || !task) return null;

  return (
    <Dialog open={open} onX={onX} className={isAdmin ? "sm:max-w-2xl" : "sm:max-w-3xl"}>
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-foreground">
            <Assignment size={32} weight="bold" />
          </div>
          <div className="space-y-1.5 w-full text-center">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase text-center w-full">
              {isAdmin ? task.title : "Task Specifications"}
            </Dialog.Title>
            {!isAdmin && (
               <div className="flex items-center justify-center gap-2 mt-2">
                  <StatusChip status={task.status} size="small" />
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-border/60">
                      {formatCategory(task.category)}
                  </Badge>
              </div>
            )}
            {isAdmin && (
              <div className="flex items-center justify-center gap-2">
                 <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{formatCategory(task.category)}</Badge>
                 <StatusChip status={task.status} size="small" />
              </div>
            )}
            <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center w-full mt-2">
              {isAdmin ? "Task Monitoring Details" : ""}
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-8 pb-10 max-h-[70vh] overflow-y-auto space-y-10">
        <FormSection
          title="General Information"
          icon={<Assignment size={16} weight="bold" />}
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
                value={formatCategory(task.category)} 
            />
            {isAdmin ? (
               <DetailItem 
                  label="Created At" 
                  value={dayjs(task.createdAt).format("MMM DD, YYYY")} 
               />
            ) : (
              <DetailItem 
                  label="Priority Level" 
                  value={task.priority?.toUpperCase()} 
              />
            )}
          </FormFieldGrid>
        </FormSection>

        <FormSection
          title="Detailed Brief"
          icon={<Assignment size={16} weight="bold" />}
          className="border-none p-0 shadow-none"
        >
          <div className="space-y-6">
            <DetailItem
              label={isAdmin ? "Overview" : "Project Description"}
              value={task.description}
              className="md:col-span-2"
            />
            <DetailItem
              label={isAdmin ? "Key Requirements" : "Technical Requirements"}
              value={task.requirements}
              className="md:col-span-2"
            />
          </div>
        </FormSection>

        {isAdmin && (
          <FormSection
            title="Associated Entities"
            icon={<Assignment size={16} weight="bold" />}
            className="border-none p-0 shadow-none"
          >
            <FormFieldGrid>
              <DetailItem 
                  label="Company" 
                  value={task.companyId?.companyName || task.companyId?.fullName || task.companyId?.email} 
              />
              <DetailItem 
                  label="Selected Vendor" 
                  value={task.selectedVendor?.fullName || task.selectedVendor?.email || "No vendor selected"} 
              />
            </FormFieldGrid>
          </FormSection>
        )}

        <FormSection
          title="Timeline & Budget"
          icon={<Assignment size={16} weight="bold" />}
          className="border-none p-0 shadow-none"
        >
          <FormFieldGrid className="sm:grid-cols-3">
            <DetailItem 
                label="Payment Type" 
                value={formatCategory(task.taskType)} 
            />
            <DetailItem 
                label="Budget (USD)" 
                value={formatCurrency(task.budget)} 
            />
            <DetailItem 
                label="Deadline" 
                value={dayjs(task.deadline).format("MMM DD, YYYY")} 
            />
          </FormFieldGrid>
        </FormSection>
      </Dialog.Body>

      <div className="grid-cols-1 grid px-8 py-6 border-t border-border/50 bg-muted/20">
          <Button
            type="button"
            variant="secondary"
            onClick={onX}
            className="font-semibold uppercase tracking-widest text-[10px] h-12 w-full max-w-xs mx-auto rounded-xl"
          >
            {isAdmin ? "Close" : "Close Specifications"}
          </Button></div>
    </Dialog>
  );
};

export default TaskDetailsModal;
