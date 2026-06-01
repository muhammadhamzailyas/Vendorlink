import React from "react";
import {
  WarningCircle,
  CheckCircle,
  Stack,
  ShieldWarning,
  Wallet,
  Prohibit,
  Trash,
} from "@phosphor-icons/react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  Dialog,
  Textarea,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

const formatMoney = (value, currency = "$") => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const recordLabels = {
  tasks: "Tasks",
  proposals: "Proposals",
  contracts: "Contracts",
  liveContracts: "Live Contracts",
  payments: "Payments",
  completedPayments: "Completed Payments",
  notifications: "Notifications",
  chats: "Chats",
  progressUpdates: "Progress Updates",
};

const UserArchiveDialog = ({
  open,
  onX,
  user,
  briefing,
  loading,
  submitting,
  reason,
  acknowledgeWarnings,
  onReasonChange,
  onAcknowledgeWarningsChange,
  onConfirm,
  mode = "delete", // 'delete' or 'deactivate'
}) => {
  const blockers = briefing?.blockers || [];
  const warnings = briefing?.warnings || [];
  const impactSummary = briefing?.impactSummary;
  const resultIfConfirmed = briefing?.resultIfConfirmed;
  const currency = impactSummary?.money?.currency || "$";
  const isDeactivate = mode === "deactivate";
  
  const canConfirm =
    Boolean(briefing) &&
    blockers.length === 0 &&
    reason.trim().length > 0 &&
    (warnings.length === 0 || acknowledgeWarnings);

  const title = isDeactivate ? "Deactivate User" : "Delete User";
  const displayName = user?.role === 'admin' ? "Admin" : (user?.companyName || user?.fullName || user?.email || "User");

  return (
    <Dialog open={open} className="sm:max-w-2xl">
      <Dialog.Header className="border-b-0 px-8 pt-10 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <UserAvatar user={user} name={displayName} size="xl" className="border-2 border-background shadow-md" />
          <div className="space-y-1.5 w-full text-center">
            <Dialog.Title className="text-xl font-black tracking-tight text-foreground uppercase text-center w-full">
              {title}
            </Dialog.Title>
            <div className="flex items-center justify-center gap-2">
               <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">{user?.role}</Badge>
               <StatusChip status={user?.status} size="small" />
            </div>
            <Dialog.Description className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] text-center w-full mt-2">
              {displayName}
            </Dialog.Description>
          </div>
        </div>
      </Dialog.Header>

      <Dialog.Body className="px-10 pb-10 bg-card space-y-8">
        {loading ? (
          <div className="rounded-xl border border-border/60 bg-card p-12 flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analysing account health...</p>
          </div>
        ) : briefing ? (
          <>
            {/* Show Alert only for Level 2 (Warning) or Level 3 (Blocked) */}
            {(blockers.length > 0 || warnings.length > 0) && (
              <Alert
                variant={blockers.length > 0 ? "destructive" : "warning"}
                className="rounded-xl border-2"
              >
                <div className="flex items-start gap-3 text-left">
                  {blockers.length > 0 ? (
                    <ShieldWarning className="h-5 w-5 mt-0.5 shrink-0" />
                  ) : (
                    <WarningCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <AlertTitle className="text-sm font-black uppercase tracking-wider mb-1">
                      {blockers.length > 0
                        ? "Action Blocked (Level 3)"
                        : "Warning: Level 2 Action"}
                    </AlertTitle>
                    <AlertDescription className="text-xs font-medium leading-relaxed opacity-90">
                      {blockers.length > 0
                        ? "This account has unresolved financial obligations. You cannot proceed until these are cleared."
                        : "This account is involved in active contracts. Continuing will cancel them and notify all parties."}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {blockers.length > 0 && (
              <section className="space-y-4 rounded-xl border border-danger/20 bg-danger-surface/40 p-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-danger">
                    Critical Blockers
                  </h4>
                </div>
                <div className="space-y-3">
                  {blockers.map((blocker) => (
                    <div
                      key={blocker.code}
                      className="rounded-xl border border-danger/20 bg-background/90 p-4"
                    >
                      <p className="text-sm font-bold text-foreground">{blocker.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {warnings.length > 0 && (
              <section className="space-y-4 rounded-xl border border-warning/20 bg-warning/5 p-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-warning">
                    Action Warnings
                  </h4>
                </div>
                <div className="space-y-3">
                  {warnings.map((warning) => (
                    <div
                      key={warning.code}
                      className="rounded-xl border border-warning/20 bg-background/90 p-4"
                    >
                      <p className="text-sm font-bold text-foreground">{warning.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="h-4 w-4 text-foreground opacity-50" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground opacity-50">
                    Financial Snapshot
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center sm:text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Available</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{formatMoney(impactSummary?.money?.walletBalance, currency)}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center sm:text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Locked</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{formatMoney(impactSummary?.money?.lockedBalance, currency)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Stack className="h-4 w-4 text-foreground opacity-50" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground opacity-50">
                    Activity Records
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(impactSummary?.retainedRecords || {}).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-border/50 bg-muted/20 p-4 text-center sm:text-left">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{recordLabels[key] || key}</p>
                      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <Textarea
                label="Action Rationale"
                labelClassName="text-[9px] font-black uppercase tracking-widest opacity-50"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder={`Document why this account is being ${mode === 'delete' ? 'deleted' : 'deactivated'}...`}
                disabled={submitting}
                className="rounded-xl border-border/60 min-h-[100px] text-sm"
              />

              {warnings.length > 0 && (
                <label className="flex items-start gap-4 rounded-xl border border-warning/20 bg-warning/5 p-4 cursor-pointer">
                  <Checkbox
                    checked={acknowledgeWarnings}
                    onCheckedChange={(checked) =>
                      onAcknowledgeWarningsChange(Boolean(checked))
                    }
                    disabled={submitting}
                    className="mt-1"
                  />
                  <span className="text-[10px] font-bold text-foreground/80 leading-relaxed uppercase tracking-tight text-left">
                    I acknowledge that this action will cancel all live contracts and notify involved counterparties.
                  </span>
                </label>
              )}
            </section>
          </>
        ) : (
          <Alert variant="destructive" className="rounded-xl">
            <ShieldWarning className="h-5 w-5" />
            <AlertTitle className="text-sm font-black uppercase">Service Error</AlertTitle>
            <AlertDescription className="text-xs font-medium">
              We couldn't generate the account briefing. Please close and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
          <Button 
            variant="secondary" 
            onClick={onX} 
            disabled={submitting} 
            className="w-full font-semibold uppercase tracking-tight text-[11px] h-12 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDeactivate ? "warning" : "danger"}
            onClick={onConfirm}
            loading={submitting}
            disabled={!canConfirm || loading}
            className="w-full font-semibold uppercase tracking-tight text-[11px] h-12 rounded-xl"
          >
            {isDeactivate ? "Deactivate User" : "Delete User"}
          </Button>
        </div>
      </Dialog.Body>
    </Dialog>
  );
};

export default UserArchiveDialog;


