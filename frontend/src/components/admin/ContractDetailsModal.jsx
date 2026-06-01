import React, { useState } from "react";
import dayjs from "dayjs";
import { 
  FileText,
  FileText as Description, 
  Buildings, 
  Calendar, 
  CurrencyDollar, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  Hash,
  ListChecks,
  ShieldCheck,
  Scales,
  ClockAfternoon,
  ArrowCounterClockwise,
  Fingerprint,
  ShieldSlash,
  Gavel,
  Signature
} from "@phosphor-icons/react";
import { Dialog, Button, DetailField, Badge, Separator, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "../ui";
import StatusChip from "../shared/StatusChip";
import { useUser } from "@/context/UserContext";
import { contractAPI } from "@/services/api";
import toastUtil from "@/lib/toast";

const ContractDetailsModal = ({ open, contract, onX, onSuccess }) => {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (open && contract) {
    console.log("[ContractDetailsModal] Role:", user?.role, "Status:", contract.status);
  }

  if (!open || !contract) return null;

  const isVendor = user?.role === "vendor";
  const isCompany = user?.role === "company";
  
  // A vendor needs to approve if the contract is pending their signature
  const needsVendorApproval = isVendor && contract.status === "pending-vendor";
  
  // A company needs to approve if the vendor has already signed (pending-company)
  const needsCompanyApproval = isCompany && contract.status === "pending-company";

  const showActionButtons = needsVendorApproval || needsCompanyApproval;

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
        await contractAPI.approveContract(contract._id, { name: user.fullName || user.email });
        toastUtil.success("Contract accepted successfully!");
        if (onSuccess) onSuccess();
        onX();
    } catch (error) {
        toastUtil.handleApiError(error);
    } finally {
        setIsSubmitting(false);
        setConfirmOpen(false);
    }
  };

  const handleReject = async () => {
      if (!rejectReason.trim()) {
          toastUtil.error("Please provide a reason for rejection");
          return;
      }
      setIsSubmitting(true);
      try {
          await contractAPI.rejectContract(contract._id, rejectReason);
          toastUtil.success("Contract rejected and returned for changes");
          if (onSuccess) onSuccess();
          onX();
      } catch (error) {
          toastUtil.handleApiError(error);
      } finally {
          setIsSubmitting(false);
          setRejectOpen(false);
      }
  };

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 opacity-70">
      {Icon && <Icon size={14} weight="bold" />}
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h4>
    </div>
  );

  return (
    <>
    <Dialog open={open} onX={onX} className="sm:max-w-4xl" aria-describedby="contract-details-description">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-muted/50 text-foreground text-center">
            <Description size={32} weight="bold" />
          </div>
          <div className="space-y-1.5 w-full text-center">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase text-center w-full">
              {contract.title}
            </Dialog.Title>
            <div className="flex items-center justify-center gap-2">
               <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{contract.category || "General"}</Badge>
               <StatusChip status={contract.status} size="small" />
            </div>
            <Dialog.Description id="contract-details-description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center w-full mt-2">
              ID: #{contract._id?.slice(-8).toUpperCase()} • Created {dayjs(contract.createdAt).format("MMM DD, YYYY")}
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-10 pb-10 bg-card space-y-12 max-h-[65vh] overflow-y-auto">
        {/* Parties & Financial Section */}
        <section>
          <SectionHeader icon={User} title="Parties & Financials" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <DetailField label="Company" valueClassName="text-sm font-bold text-foreground">
              {contract.companyId?.companyName || contract.companyId?.fullName || "N/A"}
            </DetailField>
            <DetailField label="Vendor" valueClassName="text-sm font-bold text-foreground">
              {contract.vendorId?.fullName || contract.vendorId?.email || "N/A"}
            </DetailField>
            <DetailField label="Total Budget" valueClassName="text-sm font-black text-foreground">
              ${contract.totalBudget?.toLocaleString()}
            </DetailField>
            <DetailField label="Payment Terms" valueClassName="text-sm font-bold text-foreground uppercase tracking-tight">
              {contract.paymentTerms}
            </DetailField>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={Calendar} title="Project Schedule" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <DetailField label="Start Date" valueClassName="text-sm font-bold text-foreground">
              {dayjs(contract.projectStartDate).format("MMMM DD, YYYY")}
            </DetailField>
            <DetailField label="End Date" valueClassName="text-sm font-bold text-foreground">
              {dayjs(contract.projectEndDate).format("MMMM DD, YYYY")}
            </DetailField>
            <DetailField label="Warranty Period" valueClassName="text-sm font-bold text-foreground">
              {contract.warrantyPeriod || 0} Days
            </DetailField>
          </div>
        </section>

        {/* Scope & Deliverables */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={ListChecks} title="Scope & Deliverables" />
          <div className="space-y-6">
            <DetailField 
              label="Scope of Work" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2" 
              valueClassName="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-5 rounded-xl border border-border/50 whitespace-pre-wrap"
            >
              {contract.scope || "No scope defined."}
            </DetailField>
            <DetailField 
              label="Key Deliverables" 
              labelClassName="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2" 
              valueClassName="text-xs font-medium leading-relaxed text-foreground bg-muted/30 p-5 rounded-xl border border-border/50 whitespace-pre-wrap"
            >
              {contract.deliverables || "No deliverables listed."}
            </DetailField>
          </div>
        </section>

        {/* Milestones Section */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={Clock} title="Milestone Roadmap" />
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="border-b-border/50 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-tight h-10">Milestone Phase</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-tight h-10 text-right">Amount</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-tight h-10 text-right pr-6">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contract.milestones?.length > 0 ? (
                        contract.milestones.map((m, i) => (
                            <TableRow key={i} className="border-b-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                                <TableCell className="py-4">
                                    <p className="text-[11px] font-bold text-foreground uppercase tracking-tight">{m.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Deadline: {dayjs(m.deadline).format("MMM DD, YYYY")}</p>
                                    {m.description && <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{m.description}</p>}
                                </TableCell>
                                <TableCell className="text-right text-[11px] font-black text-foreground py-4">
                                    ${m.amount?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter py-0.5 border-border/50 bg-background/50">
                                        {m.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-20 text-center text-xs text-muted-foreground opacity-50 font-bold uppercase tracking-widest">No milestones defined for this agreement</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </div>
        </section>

        {/* Legal & Compliance Section */}
        <section className="pt-8 border-t border-border/50">
          <SectionHeader icon={ShieldCheck} title="Legal & Compliance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <DetailField label="IP Ownership" valueClassName="text-sm font-bold text-foreground uppercase">
              {contract.intellectualProperty}
            </DetailField>
            <DetailField label="Confidentiality" valueClassName="text-sm font-bold text-foreground">
              {contract.confidentialityClause ? `${contract.confidentialityPeriod} Months` : "N/A"}
            </DetailField>
            <DetailField label="Notice Period" valueClassName="text-sm font-bold text-foreground">
              {contract.noticePeriod} Days
            </DetailField>
            <DetailField label="Governing Law" valueClassName="text-sm font-bold text-foreground">
              {contract.governingLaw || "N/A"}
            </DetailField>
            <DetailField label="Dispute Resolution" valueClassName="text-sm font-bold text-foreground uppercase">
              {contract.disputeResolution}
            </DetailField>
            <DetailField label="Revision Limit" valueClassName="text-sm font-bold text-foreground">
              {contract.revisionLimit} Rounds
            </DetailField>
          </div>

          <div className="mt-8 space-y-6">
            {contract.revisionPolicy && (
                <DetailField label="Revision Policy" valueClassName="text-xs font-medium text-foreground/80 bg-muted/20 p-4 rounded-xl border border-border/40">
                    {contract.revisionPolicy}
                </DetailField>
            )}
            {contract.terminationClause && (
                <DetailField label="Termination Clause" valueClassName="text-xs font-medium text-foreground/80 bg-muted/20 p-4 rounded-xl border border-border/40">
                    {contract.terminationClause}
                </DetailField>
            )}
          </div>
        </section>
      </Dialog.Body>

      <div className="flex items-center justify-between px-8 py-8 border-t border-border/50 bg-muted/20">
          <Button 
            variant="ghost" 
            onClick={onX} 
            className="font-semibold uppercase tracking-widest text-[10px] h-12 px-8"
          >
            Close brief
          </Button>

          {showActionButtons && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="ghost"
                    onClick={() => setRejectOpen(true)}
                    className="w-full font-semibold uppercase tracking-widest text-[10px] h-12 px-6 text-error hover:bg-error/10"
                >
                    Request Changes
                </Button>
                <Button 
                    onClick={() => setConfirmOpen(true)}
                    className="w-full font-semibold uppercase tracking-widest text-[10px] h-12 px-10 shadow-lg"
                >
                    Accept & Sign
                </Button>
              </div>
          )}
      </div>
    </Dialog>

    {/* Confirmation Alert */}
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Finalize Agreement Terms?</AlertDialogTitle>
                <AlertDialogDescription>
                    By clicking confirm, you are digitally signing this contract. This will finalize the agreement and move it to the active project phase.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button onClick={handleAccept} loading={isSubmitting}>Confirm & Sign</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    {/* Rejection Alert */}
    <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Request Changes</AlertDialogTitle>
                <AlertDialogDescription>
                    Please explain why you are rejecting this contract so the client can adjust the terms accordingly.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
                <textarea 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Budget for Milestone 2 is lower than agreed, or deadline needs extending..."
                    className="w-full rounded-xl border border-border bg-background p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={4}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleReject} loading={isSubmitting}>Reject & Notify Client</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ContractDetailsModal;
