import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { contractAPI } from "@/services/api";
import { useUser } from "@/context/UserContext";
import { formatDate } from "@/lib/dateUtils";
import { showToast, confirmToast } from "@/lib/toast";
import StatusChip from "@/components/shared/StatusChip";
import {
  ArrowLeft, Download, Check, X, Prohibit, Trash, CircleNotch, Info, Calendar, CurrencyDollar
} from "@phosphor-icons/react";
import { 
  PageTransition, 
  Button, 
  Card, 
  Input, 
  Dialog, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  Separator,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from "@/components/ui";
import { DetailMetaGrid, DetailMetaItem, DetailSection } from "@/components/shared/DetailLayout";

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [reasonDialog, setReasonDialog] = useState({ open: false, type: null, value: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await contractAPI.getContractById(id);
        setContract(res.data?.data || res.data);
      } catch {
        showToast("Failed to load contract", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await contractAPI.approveContract(id, { name: user?.fullName || user?.email });
      setContract(res.data?.contract || res.data);
      showToast("Contract approved!", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to approve", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => setReasonDialog({ open: true, type: "reject", value: "" });
  const handleCancel = () => setReasonDialog({ open: true, type: "cancel", value: "" });

  const handleReasonConfirm = async () => {
    const { type, value } = reasonDialog;
    if (!value.trim()) return;
    setReasonDialog({ open: false, type: null, value: "" });
    setActionLoading(true);
    try {
      if (type === "reject") {
        const res = await contractAPI.rejectContract(id, value.trim());
        setContract(res.data?.contract || res.data);
        showToast("Contract rejected", "success");
      } else {
        const res = await contractAPI.cancelContract(id, value.trim());
        setContract(res.data?.contract || res.data);
        showToast("Contract cancelled", "success")
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await contractAPI.downloadContract(id);
      const blob = new Blob([res.data], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to download", "error");
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await contractAPI.addNote(id, noteText.trim());
      setContract((prev) => ({ ...prev, notes: res.data?.notes || prev.notes }));
      setNoteText("");
      showToast("Note added", "success");
    } catch {
      showToast("Failed to add note", "error");
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmToast("Delete this contract? This action cannot be undone.", {
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    });
    if (!confirmed) return;
    try {
      await contractAPI.deleteContract(id);
      showToast("Contract deleted", "success");
      navigate(-1);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete", "error");
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        </div>
      </PageTransition>
    );
  }

  if (!contract) {
    return (
      <PageTransition>
      <div className="space-y-8">
        <div className="text-center py-12 text-muted-foreground">Contract not found</div>
      </div>
      </PageTransition>
    );
  }

  const isCompany = (contract.companyId?._id || contract.companyId) === user?.id;
  const isVendor = (contract.vendorId?._id || contract.vendorId) === user?.id;
  const canApprove =
    (isCompany && !contract.companyApproved && !["active", "completed", "cancelled", "rejected"].includes(contract.status)) ||
    (isVendor && !contract.vendorApproved && !["active", "completed", "cancelled", "rejected"].includes(contract.status));
  const canReject = (isCompany || isVendor) && !["active", "completed", "cancelled", "rejected"].includes(contract.status);
  const canCancel = (isCompany || isVendor) && !(contract.companyApproved && contract.vendorApproved) && !["completed", "cancelled"].includes(contract.status);
  const canDelete = isCompany && ["draft", "cancelled", "rejected"].includes(contract.status);

  return (
    <PageTransition>
    <div className="space-y-8 pb-12">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/${user?.role}`}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/${user?.role}/contracts`}>Contracts</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{contract?.title || "Contract Detail"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase">{contract.title || "Contract Detail"}</h2>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              <span>ID: {contract._id}</span>
              <Separator orientation="vertical" className="h-3" />
              <span>Created {formatDate(contract.createdAt)}</span>
          </div>
        </div>
        <div className="grid-cols-1 grid gap-2 shrink-0">
          <Button type="button" variant="secondary" size="xs" onClick={() => navigate(-1)} className="w-full font-bold uppercase tracking-tight">
            
            Back
          </Button>
          <StatusChip status={contract.status} /></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DetailSection title="Contract Narrative" description="Document work scope, expected deliverables, and project identity.">
                <div className="space-y-6">
                    <div>
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Info size={12} className="text-foreground" />
                            Description
                        </h4>
                        <p className="text-sm font-medium leading-relaxed text-foreground/80 bg-muted/30 p-4 rounded-xl border border-border/50">
                            {contract.description || "No description provided."}
                        </p>
                    </div>
                    {contract.scope && (
                        <div>
                            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Scope of Work</h4>
                            <p className="text-sm font-medium leading-relaxed text-foreground/80">
                                {contract.scope}
                            </p>
                        </div>
                    )}
                </div>
            </DetailSection>

            <DetailSection title="Milestones & Deliverables" description="Financial checkpoints and delivery expectations.">
                <Card className="overflow-hidden border-border/50 shadow-soft">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px] font-bold uppercase tracking-tight">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-tight">Deadline</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-tight">Amount</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-tight text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contract.milestones?.length > 0 ? (
                                contract.milestones.map((m, i) => (
                                    <TableRow key={i} className="group hover:bg-muted/20 transition-colors">
                                        <TableCell>
                                            <div className="font-bold text-sm text-foreground">{m.title}</div>
                                            {m.description && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{m.description}</div>}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-foreground/80">
                                            {m.deadline ? formatDate(m.deadline) : "N/A"}
                                        </TableCell>
                                        <TableCell className="text-sm font-bold text-foreground">
                                            ${m.amount?.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <StatusChip status={m.status || "pending"} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                        No milestones defined for this contract.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </DetailSection>

            <DetailSection title="Discussion & Context" description="Shared communication history for this agreement.">
                <Card className="bg-muted/20 border-border/50 shadow-none">
                    <Card.Content className="p-4 space-y-4">
                        {contract.notes?.length > 0 ? (
                        <div className="space-y-3">
                            {contract.notes.map((note, i) => (
                            <div key={i} className="group relative flex flex-col gap-1 p-4 rounded-xl bg-card border border-border/50 shadow-soft">
                                <p className="text-[13px] font-medium text-foreground/80 leading-relaxed">{note.content}</p>
                                <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground/40 mt-1">
                                    {note.createdAt ? formatDate(note.createdAt) : ""}
                                </p>
                            </div>
                            ))}
                        </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground/60">No notes added yet</p>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-2 sm:flex-row pt-2">
                            <Input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                                placeholder="Add a clarification note..."
                                className="flex-1 h-11 bg-card rounded-xl border-border/50"
                            />
                            <Button onClick={handleAddNote} className="h-11 px-6 font-semibold uppercase tracking-tight shadow-soft">
                                Add Note
                            </Button>
                        </div>
                    </Card.Content>
                </Card>
            </DetailSection>
          </div>

          <div className="space-y-6">
            <Card className="shadow-soft border-border/50">
                <Card.Header className="pb-3">
                    <Card.Title className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Contract Summary</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60">Total Budget</p>
                            <p className="text-lg font-bold text-foreground flex items-center gap-1">
                                <CurrencyDollar size={16} className="text-success" />
                                {contract.totalBudget?.toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-extrabold uppercase tracking-tighter text-muted-foreground/60">Category</p>
                            <p className="text-sm font-bold text-foreground uppercase tracking-tight truncate">{contract.category || "General"}</p>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase">
                                <Calendar size={14} className="text-foreground" />
                                Start Date
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{contract.projectStartDate ? formatDate(contract.projectStartDate) : "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase">
                                <Calendar size={14} className="text-foreground" />
                                End Date
                            </div>
                            <span className="text-[11px] font-bold text-foreground">{contract.projectEndDate ? formatDate(contract.projectEndDate) : "N/A"}</span>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Company Approved</span>
                            <div className={`h-2 w-2 rounded-full ${contract.companyApproved ? "bg-success" : "bg-muted"}`} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Vendor Approved</span>
                            <div className={`h-2 w-2 rounded-full ${contract.vendorApproved ? "bg-success" : "bg-muted"}`} />
                        </div>
                    </div>
                </Card.Content>
                <Card.Footer className="bg-muted/30 p-4 border-t border-border/50 flex flex-col gap-2">
                    {canApprove && (
                        <Button onClick={handleApprove} disabled={actionLoading} variant="primary" className="w-full font-semibold uppercase tracking-tight shadow-soft">
                            
                            Approve Agreement
                        </Button>
                    )}
                    {canReject && (
                        <Button onClick={handleReject} disabled={actionLoading} variant="secondary" className="w-full font-semibold uppercase tracking-tight text-danger hover:bg-danger-surface">
                            
                            Reject
                        </Button>
                    )}
                    {canCancel && (
                        <Button onClick={handleCancel} disabled={actionLoading} variant="secondary" className="w-full font-semibold uppercase tracking-tight">
                            
                            Cancel Contract
                        </Button>
                    )}
                    <Button onClick={handleDownload} variant="outline" className="w-full font-semibold uppercase tracking-tight border-border/50 bg-card">
                        
                        Download HTML
                    </Button>
                    {canDelete && (
                        <Button onClick={handleDelete} variant="ghost" className="w-full font-semibold uppercase tracking-tight text-danger/60 hover:text-danger hover:bg-danger-surface/50">
                            
                            Delete Draft
                        </Button>
                    )}
                </Card.Footer>
            </Card>

            <Card className="border-ring/10 bg-muted/10 shadow-none">
                <Card.Content className="p-4">
                    <div className="flex gap-3">
                        <div className="mt-0.5 rounded-full bg-foreground/10 p-1">
                            <Info size={14} className="text-foreground" />
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed text-muted-foreground italic">
                            Both parties must approve the contract before it transitions to "Active" status. Once active, milestone tracking begins.
                        </p>
                    </div>
                </Card.Content>
            </Card>
          </div>
      </div>

      <Dialog
        open={reasonDialog.open}
        onX={() => setReasonDialog({ open: false, type: null, value: "" })}
      >
        <Dialog.Header onX={() => setReasonDialog({ open: false, type: null, value: "" })}>
          {reasonDialog.type === "reject" ? "Reject Contract" : "Cancel Contract"}
        </Dialog.Header>
        <Dialog.Body>
          <Input
            label={reasonDialog.type === "reject" ? "Rejection reason" : "Cancellation reason"}
            placeholder="Enter a reason"
            value={reasonDialog.value}
            onChange={(e) => setReasonDialog((prev) => ({ ...prev, value: e.target.value }))}
          />
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            variant="secondary"
            onClick={() => setReasonDialog({ open: false, type: null, value: "" })}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleReasonConfirm}
            disabled={!reasonDialog.value.trim() || actionLoading}
          >
            {actionLoading ? "Saving..." : "Confirm"}
          </Button>
        </Dialog.Footer>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default ContractDetail;





