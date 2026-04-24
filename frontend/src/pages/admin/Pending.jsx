import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Buildings, CheckCircle, XCircle, Clock, Storefront, Lightning } from "@phosphor-icons/react";
import toastUtil from "@/lib/toast";
import { adminService } from "@/services/api";
import { Button, Card, Dialog, EmptyState, Label, PageTransition, Skeleton, StatCard, Textarea } from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";

dayjs.extend(relativeTime);

const Pending = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setMagnifyingGlass] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [decisionDialog, setDecisionDialog] = useState({
    open: false,
    action: null,
    record: null,
    reason: "Profile verification failed",
  });

  const loadPending = async () => {
    setLoading(true);
    try {
      const response = await adminService.getPendingVerifications();
      setRecords(response.data || []);
    } catch (error) {
      toastUtil.handleApiError(error, { default: "Could not load pending verifications" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        record.email?.toLowerCase().includes(query) ||
        record.companyName?.toLowerCase().includes(query) ||
        record.companyProfile?.companyName?.toLowerCase().includes(query) ||
        record.vendorProfile?.fullName?.toLowerCase().includes(query) ||
        record.role?.toLowerCase().includes(query);

      if (activeTab === 0) return matchesSearch;
      if (activeTab === 1) return matchesSearch && record.role === "company";
      if (activeTab === 2) return matchesSearch && record.role === "vendor";
      return matchesSearch && (record.selectedPlan || "free") === "premium";
    });
  }, [records, search, activeTab]);

  const stats = useMemo(() => {
    const companies = records.filter((record) => record.role === "company").length;
    const vendors = records.filter((record) => record.role === "vendor").length;
    const premium = records.filter((record) => (record.selectedPlan || "free") === "premium").length;

    return {
      total: records.length,
      companies,
      vendors,
      premium,
    };
  }, [records]);

  const onApprove = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await adminService.approveVerification(userId);
      toastUtil.success("Profile approved");
      await loadPending();
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const onReject = async (userId, reason) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await adminService.rejectVerification(userId, { reason });
      toastUtil.success("Profile rejected");
      await loadPending();
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleOpenDecisionDialog = (action, record) => {
    setDecisionDialog({
      open: true,
      action,
      record,
      reason: "Profile verification failed",
    });
  };

  const handleXDecisionDialog = () => {
    setDecisionDialog({
      open: false,
      action: null,
      record: null,
      reason: "Profile verification failed",
    });
  };

  const handleConfirmDecision = async () => {
    if (!decisionDialog.record) {
      return;
    }

    if (decisionDialog.action === "approve") {
      await onApprove(decisionDialog.record._id);
      handleXDecisionDialog();
      return;
    }

    if (!decisionDialog.reason.trim()) {
      toastUtil.validationError("Rejection reason is required");
      return;
    }

    await onReject(decisionDialog.record._id, decisionDialog.reason.trim());
    handleXDecisionDialog();
  };

  const statusTabs = ["All", "Companies", "Vendors", "Premium"];

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Total" value={stats.total} icon={<Clock />} />
        <StatCard title="Companies" value={stats.companies} icon={<Buildings />} />
        <StatCard title="Vendors" value={stats.vendors} icon={<Storefront />} />
        <StatCard title="Premium Plans" value={stats.premium} icon={<Lightning />} />
      </div>

      <FilterSearchBar
        searchValue={search}
        onSearchChange={setMagnifyingGlass}
        searchPlaceholder="MagnifyingGlass by email, role, or business"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={statusTabs}
      />

      {loading ? (
        <Skeleton.Page rows={4} className="bg-muted" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No pending verification records"
          description="There are no onboarding submissions waiting for review right now."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => (
            <Card key={record._id} className="bg-card border-border">
              <Card.Header className="gap-4 sm:flex-row sm:items-start sm:justify-between border-b-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">{record.role}</span>
                    <StatusChip status={record.status} />
                    <span className="text-muted-foreground text-xs font-medium">{dayjs(record.createdAt).fromNow()}</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground uppercase tracking-tight">
                    {record.companyName || record.companyProfile?.companyName || record.vendorProfile?.fullName || record.email}
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{record.email}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Plan: {(record.selectedPlan || "free").toUpperCase()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    icon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => handleOpenDecisionDialog("approve", record)}
                    disabled={actionLoading[record._id]}
                    className="rounded-xl font-bold uppercase tracking-tight text-[11px]"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle className="h-4 w-4" />}
                    onClick={() => handleOpenDecisionDialog("reject", record)}
                    disabled={actionLoading[record._id]}
                    className="rounded-xl font-bold uppercase tracking-tight text-[11px]"
                  >
                    Reject
                  </Button>
                </div>
              </Card.Header>

              <Card.Content className="grid gap-6 sm:grid-cols-2 pt-4">
                <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-foreground">Profile Details</p>
                  {record.role === "company" ? (
                    <ul className="space-y-2 text-sm text-foreground">
                      <li className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase">Company</span> {record.companyProfile?.companyName || "N/A"}</li>
                      <li className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase">Industry</span> {record.companyProfile?.industry || "N/A"}</li>
                      <li className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase">Description</span> <span className="text-xs leading-relaxed">{record.companyProfile?.description || "N/A"}</span></li>
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm text-foreground">
                      <li className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase">Category</span> {record.vendorProfile?.category || "N/A"}</li>
                      <li className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase">Skills</span> <div className="flex flex-wrap gap-1 mt-1">{(record.vendorProfile?.skills || []).map(s => <span key={s} className="px-2 py-0.5 bg-card border border-border rounded text-[10px] font-bold">{s}</span>) || "N/A"}</div></li>
                      <li className="flex flex-col"><span className="text-[10px] font-bold text-muted-foreground uppercase">Bio</span> <span className="text-xs leading-relaxed">{record.vendorProfile?.bio || "N/A"}</span></li>
                    </ul>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-foreground">Verification Document</p>
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-card">
                  {record.role === "company" && record.companyProfile?.documentURL ? (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8002"}${record.companyProfile.documentURL}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-foreground uppercase tracking-widest hover:underline flex items-center gap-2"
                    >
                      View Document <Lightning size={14} className="text-warning" />
                    </a>
                  ) : record.role === "vendor" && record.vendorProfile?.documentURL ? (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:8002"}${record.vendorProfile.documentURL}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-foreground uppercase tracking-widest hover:underline flex items-center gap-2"
                    >
                      View Document <Lightning size={14} className="text-warning" />
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No document uploaded</p>
                  )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={decisionDialog.open} onX={handleXDecisionDialog} className="max-w-xl">
        <Dialog.Header onX={handleXDecisionDialog} className="border-b-0 bg-card">
          <Dialog.Title className="text-foreground font-bold uppercase tracking-tight">
            {decisionDialog.action === "approve" ? "Approve Submission" : "Reject Submission"}
          </Dialog.Title>
          <Dialog.Description className="text-muted-foreground">
            {decisionDialog.action === "approve"
              ? "This account will be marked as approved and gain normal platform access."
              : "Provide a rejection reason before rejecting this onboarding submission."}
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="bg-card">
          <div className="rounded-2xl border border-border bg-muted p-5 text-sm">
            <p className="font-bold text-foreground uppercase tracking-tight">
              {decisionDialog.record?.companyName || decisionDialog.record?.companyProfile?.companyName || decisionDialog.record?.vendorProfile?.fullName || decisionDialog.record?.email}
            </p>
            <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">{decisionDialog.record?.email}</p>
          </div>
          {decisionDialog.action === "reject" ? (
            <div className="mt-6 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rejection Reason</Label>
              <Textarea
                value={decisionDialog.reason}
                onChange={(event) => setDecisionDialog((current) => ({ ...current, reason: event.target.value }))}
                rows={4}
                className="w-full"
                placeholder="Explain why this profile was not approved..."
              />
            </div>
          ) : null}
        </Dialog.Body>
        <Dialog.Footer className="border-t border-border bg-muted/30">
          <Button type="button" variant="secondary" onClick={handleXDecisionDialog} className="uppercase font-bold tracking-tight text-[11px]">Cancel</Button>
          <Button
            type="button"
            variant={decisionDialog.action === "approve" ? "success" : "danger"}
            onClick={handleConfirmDecision}
            loading={Boolean(decisionDialog.record?._id && actionLoading[decisionDialog.record._id])}
            className="uppercase font-bold tracking-tight text-[11px]"
          >
            {decisionDialog.action === "approve" ? "Approve Profile" : "Reject Profile"}
          </Button>
        </Dialog.Footer>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default Pending;



