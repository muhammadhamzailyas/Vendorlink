import React from "react";
import { DownloadSimple } from "@phosphor-icons/react";
import dayjs from "dayjs";
import { Dialog, Button, DetailField } from "../ui";
import StatusChip from "../shared/StatusChip";

const UserDetailsModal = ({ open, user, onX, onDownloadPDF }) => {
  if (!open || !user) return null;

  return (
    <Dialog open={open} onX={onX}>
      <Dialog.Header onX={onX} className="border-b border-border px-6 py-6 bg-muted/50">
        <Dialog.Title className="text-base font-black tracking-widest text-foreground uppercase">
          User Details
        </Dialog.Title>
        <Dialog.Description className="sr-only">
          Detailed profile and status information for {user.companyName || user.email}.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Body className="p-8 bg-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <DetailField label="Company Name" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold text-foreground">
            {user.companyName || "N/A"}
          </DetailField>
          <DetailField label="Email" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold text-foreground">
            {user.email || "N/A"}
          </DetailField>
          <DetailField label="Username" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold text-foreground">
            {user.username || "N/A"}
          </DetailField>
          <DetailField label="Role" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold uppercase tracking-tight text-foreground">
            {user.role || "N/A"}
          </DetailField>
          <DetailField label="Status" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <StatusChip status={user.status} size="medium" className="mt-1" />
          </DetailField>
          <DetailField label="Registration Date" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold text-foreground">
            {dayjs(user.createdAt).format("MMM DD, YYYY")}
          </DetailField>
          {user.businessType && (
            <DetailField label="Business Type" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold text-foreground">
              {user.businessType}
            </DetailField>
          )}
          {user.vendorType && (
            <DetailField label="Vendor Type" labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground" valueClassName="text-sm font-bold text-foreground">
              {user.vendorType}
            </DetailField>
          )}
          {user.description && (
            <DetailField
              label="Description"
              colSpan={2}
              labelClassName="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              valueClassName="text-sm font-medium leading-relaxed text-foreground"
            >
              {user.description}
            </DetailField>
          )}
        </div>
      </Dialog.Body>
      <Dialog.Footer className="border-t border-border px-6 py-4 bg-muted/50 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onX} className="font-bold uppercase tracking-tight text-[11px]">Close</Button>
        <Button onClick={onDownloadPDF} icon={<DownloadSimple className="w-4 h-4" />} className="font-bold uppercase tracking-tight text-[11px]">
          Download PDF
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};

export default UserDetailsModal;



