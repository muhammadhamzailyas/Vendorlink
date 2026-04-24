import React from "react";
import {
  Archive,
  WarningCircle,
  CheckCircle,
  Stack,
  ShieldWarning,
  Wallet,
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

const formatMoney = (value, currency = "PKR") => {
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
}) => {
  const blockers = briefing?.blockers || [];
  const warnings = briefing?.warnings || [];
  const impactSummary = briefing?.impactSummary;
  const resultIfConfirmed = briefing?.resultIfConfirmed;
  const currency = impactSummary?.money?.currency || "PKR";
  const canConfirm =
    Boolean(briefing) &&
    blockers.length === 0 &&
    reason.trim().length > 0 &&
    (warnings.length === 0 || acknowledgeWarnings);

  return (
    <Dialog open={open} onX={onX} className="sm:max-w-3xl">
      <Dialog.Header onX={onX}>
        <div className="space-y-1">
          <Dialog.Title className="text-lg font-extrabold uppercase tracking-tight">
            Archive User
          </Dialog.Title>
          <Dialog.Description>
            Review the archive briefing before removing this account from active use.
          </Dialog.Description>
        </div>
      </Dialog.Header>

      <Dialog.Body className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Target User
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                {user?.companyName || user?.username || user?.email || "User"}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email || "-"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="uppercase">
                {user?.role || "user"}
              </Badge>
              <StatusChip status={user?.status} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <Archive className="h-4 w-4 animate-pulse" />
              Loading archive briefing...
            </div>
          </div>
        ) : briefing ? (
          <>
            <Alert
              variant={
                blockers.length > 0 ? "destructive" : warnings.length > 0 ? "warning" : "success"
              }
            >
              {blockers.length > 0 ? (
                <ShieldWarning className="h-4 w-4" />
              ) : warnings.length > 0 ? (
                <WarningCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {blockers.length > 0
                  ? "Archive Blocked"
                  : warnings.length > 0
                    ? "Archive Requires Review"
                    : "Archive Ready"}
              </AlertTitle>
              <AlertDescription>
                {blockers.length > 0
                  ? "The user still has unresolved financial obligations. Archive stays disabled until those are cleared."
                  : warnings.length > 0
                    ? "This archive can continue, but it will cancel live contracts and notify the other party."
                    : "No blocking conditions were found. The account can be archived now."}
              </AlertDescription>
            </Alert>

            {blockers.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-danger/20 bg-danger-surface/40 p-4">
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-danger">
                    Blocking Conditions
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These items must be resolved before the user can be archived.
                  </p>
                </div>
                <div className="space-y-3">
                  {blockers.map((blocker) => (
                    <div
                      key={blocker.code}
                      className="rounded-xl border border-danger/20 bg-background/90 p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">{blocker.message}</p>
                      {Array.isArray(blocker.details) && blocker.details.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {blocker.details.map((detail) => {
                            const detailLabel = detail.title || detail.type || detail.status || "Item";
                            const amountLabel = detail.amount
                              ? ` | ${formatMoney(detail.amount, currency)}`
                              : "";

                            return (
                              <Badge
                                key={detail.id || `${blocker.code}-${detail.status}-${detail.amount}`}
                                variant="outline"
                                className="border-danger/30 bg-danger-surface/30 text-danger"
                              >
                                {detailLabel + amountLabel}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {warnings.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-warning">
                    Warnings
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These items do not block archive, but they change related contracts.
                  </p>
                </div>
                <div className="space-y-3">
                  {warnings.map((warning) => (
                    <div
                      key={warning.code}
                      className="rounded-xl border border-warning/20 bg-background/90 p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">{warning.message}</p>
                      {Array.isArray(warning.details) && warning.details.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {warning.details.map((detail) => {
                            const detailLabel = detail.title || "Contract";
                            const statusLabel = detail.status ? ` | ${detail.status}` : "";

                            return (
                              <Badge
                                key={detail.id || `${warning.code}-${detail.status}`}
                                variant="warning"
                                className="uppercase"
                              >
                                {detailLabel + statusLabel}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-foreground" />
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-foreground">
                    Money Summary
                  </h4>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Wallet Balance
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {formatMoney(impactSummary?.money?.walletBalance, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Locked Balance
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {formatMoney(impactSummary?.money?.lockedBalance, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Pending Payments
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {impactSummary?.money?.pendingPayments?.count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(impactSummary?.money?.pendingPayments?.totalAmount, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Pending Transactions
                    </p>
                    <p className="mt-2 text-base font-bold text-foreground">
                      {impactSummary?.money?.pendingTransactions?.count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(
                        impactSummary?.money?.pendingTransactions?.totalAmount,
                        currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <div className="flex items-center gap-2">
                  <Stack className="h-4 w-4 text-foreground" />
                  <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-foreground">
                    Retained Records
                  </h4>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {Object.entries(impactSummary?.retainedRecords || {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {recordLabels[key] || key}
                      </p>
                      <p className="mt-2 text-base font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-foreground">
                Result If Confirmed
              </h4>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>{resultIfConfirmed?.userAccess}</p>
                <p>{resultIfConfirmed?.contractOutcome}</p>
                <p>{resultIfConfirmed?.dataRetention}</p>
              </div>
            </section>

            <section className="space-y-3">
              <Textarea
                label="Admin Reason"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Document why this account is being archived..."
                disabled={submitting}
              />

              {warnings.length > 0 && (
                <label className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-foreground">
                  <Checkbox
                    checked={acknowledgeWarnings}
                    onCheckedChange={(checked) =>
                      onAcknowledgeWarningsChange(Boolean(checked))
                    }
                    disabled={submitting}
                    className="mt-0.5"
                  />
                  <span>
                    I understand that continuing will cancel the live contract(s), store the
                    admin reason, and notify the other party.
                  </span>
                </label>
              )}
            </section>
          </>
        ) : (
          <Alert variant="destructive">
            <ShieldWarning className="h-4 w-4" />
            <AlertTitle>Archive Briefing Unavailable</AlertTitle>
            <AlertDescription>
              The archive briefing could not be loaded. X this dialog and try again.
            </AlertDescription>
          </Alert>
        )}
      </Dialog.Body>

      <Dialog.Footer>
        <Button type="button" variant="secondary" onClick={onX} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          loading={submitting}
          disabled={!canConfirm || loading}
        >
          Archive User
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
};

export default UserArchiveDialog;



