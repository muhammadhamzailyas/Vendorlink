import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  HandCoins,
  CheckCircle,
  Clock,
  ArrowsClockwise,
  PaperPlaneTilt as Send,
  TrendUp,
  ArrowCircleDown,
  Receipt,
  FileText
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/toast";
import { Button, Input, Textarea, Card, Dialog, Tabs, TabsList, TabsTrigger, TabsContent, PageTransition, Loader, EmptyState, StatCard, Badge, Separator } from "@/components/ui";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import StatusChip from "@/components/shared/StatusChip";
import FormSection from "@/components/shared/FormSection";
import dayjs from "dayjs";

const requestSchema = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
  notes: z.string().optional(),
});

const VendorPayments = () => {
  const [requestDialog, setRequestDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("earnings");

  const { refreshWallet, formatCurrency } = useWallet();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", "payment-data"],
    queryFn: async () => {
      const [tasksRes, summaryRes] = await Promise.all([
        paymentAPI.getVendorActiveTasks().catch(() => ({ data: { data: [] } })),
        paymentAPI.getVendorPaymentSummary().catch(() => ({ data: { data: null } })),
      ]);
      return {
        activeTasks: tasksRes?.data?.data || tasksRes?.data || [],
        summary: summaryRes?.data?.data || null,
      };
    },
    onError: () => showToast("error", "Failed to load payment data"),
  });

  const activeTasks = data?.activeTasks || [];
  const summary = data?.summary;

  const confirmMutation = useMutation({
    mutationFn: (paymentId) => paymentAPI.confirmPayment(paymentId),
    onSuccess: () => {
      showToast("success", "Payment confirmed!");
      queryClient.invalidateQueries({ queryKey: ["vendor", "payment-data"] });
      refreshWallet();
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Failed to confirm payment"),
  });

  const requestMutation = useMutation({
    mutationFn: (data) => paymentAPI.requestPayment(data),
    onSuccess: () => {
      showToast("success", "Payment request sent to company");
      setRequestDialog(false);
      queryClient.invalidateQueries({ queryKey: ["vendor", "payment-data"] });
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Failed to send request"),
  });

  const form = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { amount: "", notes: "" },
  });

  const handleRequestPayment = (task) => {
    setSelectedTask(task);
    form.reset({ amount: task.pendingAmount, notes: "" });
    setRequestDialog(true);
  };

  const onRequestSubmit = (data) => {
    requestMutation.mutate({
      contractId: selectedTask.contractId,
      amount: data.amount,
      notes: data.notes,
    });
  };

  const handleArrowsClockwise = () => {
    queryClient.invalidateQueries({ queryKey: ["vendor", "payment-data"] });
    refreshWallet();
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase">Revenue & Finance</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Track received payments, pending balances, and outgoing payment requests.
            </p>
          </div>
          <Button variant="secondary" size="xs" icon={<ArrowsClockwise className="h-4 w-4" />} onClick={handleArrowsClockwise} className="font-bold uppercase tracking-tight">
            Sync Ledger
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard title="Available Balance" value={formatCurrency(summary.availableBalance)} icon={<Wallet />} />
            <StatCard title="Gross Earnings" value={formatCurrency(summary.totalEarned)} icon={<TrendUp />} />
            <StatCard title="Gross Withdrawn" value={formatCurrency(summary.totalWithdrawn)} icon={<ArrowCircleDown />} />
            <StatCard title="Pending Assets" value={formatCurrency(summary.pendingAmount)} icon={<Clock />} />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[var(--muted)]/50 p-1 h-auto flex flex-wrap justify-start gap-1 w-fit mb-8 shadow-inner border border-[var(--border)]/50">
                <TabsTrigger 
                    value="earnings"
                    className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-[var(--foreground)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-soft transition-all"
                >
                    <HandCoins className="mr-2 h-3.5 w-3.5" />
                    Work & Earnings
                </TabsTrigger>
                <TabsTrigger 
                    value="wallet"
                    className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-[var(--foreground)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-soft transition-all"
                >
                    <Wallet className="mr-2 h-3.5 w-3.5" />
                    Treasury Dashboard
                </TabsTrigger>
            </TabsList>

            <TabsContent value="earnings" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {isLoading ? (
                <Loader />
                ) : activeTasks.length === 0 ? (
                <EmptyState icon={Receipt} title="No active tasks with revenue" description="You'll see tasks here once you have contracts with pending or completed payments." className="py-16" />
                ) : (
                <div className="grid grid-cols-1 gap-6">
                    {activeTasks.map((task) => (
                        <Card key={task.contractId} className="shadow-soft border-[var(--border)]/50 overflow-hidden">
                            <Card.Header className="pb-4 border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-[var(--card)] border border-[var(--border)]/50 flex items-center justify-center shadow-xs">
                                            <FileText className="h-5 w-5 text-[var(--foreground)]" />
                                        </div>
                                        <div>
                                            <Card.Title className="text-sm font-bold uppercase tracking-tight">{task.title}</Card.Title>
                                            <Card.Description className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[var(--border)]/50">Partner</Badge>
                                                {task.company?.companyName || task.company?.username || "—"}
                                            </Card.Description>
                                        </div>
                                    </div>
                                    {task.canRequestPayment ? (
                                        <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={() => handleRequestPayment(task)} className="font-bold uppercase tracking-tight shadow-soft">
                                        Request Payout
                                        </Button>
                                    ) : <StatusChip status="processing" />}
                                </div>
                            </Card.Header>
                            <Card.Content className="p-6">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                    <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)]/30">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]/60 mb-1.5">Total Budget</p>
                                        <p className="text-lg font-extrabold text-[var(--foreground)] uppercase tracking-tight">{formatCurrency(task.totalBudget)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-jade-400/10 border border-jade-600/20">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-jade-600/60 mb-1.5">Gross Received</p>
                                        <p className="text-lg font-extrabold text-jade-600 uppercase tracking-tight">{formatCurrency(task.vendorReceived)}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-warning/60 mb-1.5">Pending Amount</p>
                                        <p className="text-lg font-extrabold text-warning uppercase tracking-tight">{formatCurrency(task.pendingAmount)}</p>
                                    </div>
                                </div>

                                {task.payments && task.payments.length > 0 ? (
                                    <div className="mt-8 space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-1 w-6 rounded-full bg-[var(--foreground)]" />
                                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]/80">Payment Ledger</p>
                                        </div>
                                        <div className="space-y-2">
                                            {task.payments.map((p) => (
                                            <div key={p._id} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[var(--border)]/50 bg-[var(--card)] p-4 text-sm sm:flex-row sm:items-center shadow-xs hover:border-[var(--ring)]/10 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${p.status === "completed" ? "bg-jade-600/10 text-jade-600" : "bg-warning/10 text-warning"}`}>
                                                        {p.status === "completed" ? <CheckCircle className="h-4.5 w-4.5" /> : <Clock className="h-4.5 w-4.5" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-[var(--foreground)] uppercase tracking-tight block">{formatCurrency(p.vendorAmount)}</span>
                                                        <span className="text-[10px] font-bold text-[var(--muted-foreground)]/60 uppercase tracking-widest">{p.paymentType} • {dayjs(p.createdAt).format("MMM D, YYYY")}</span>
                                                    </div>
                                                </div>
                                                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                                                    {p.status === "completed" && !p.vendorConfirmed ? (
                                                        <Button
                                                            size="xs"
                                                            variant="success"
                                                            className="font-bold uppercase tracking-tight px-4"
                                                            onClick={() => confirmMutation.mutate(p._id)}
                                                            loading={confirmMutation.isPending}
                                                        >
                                                            Acknowledge
                                                        </Button>
                                                    ) : <StatusChip status={p.status} />}
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </Card.Content>
                        </Card>
                    ))}
                </div>
                )}
            </TabsContent>

            <TabsContent value="wallet" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <WalletDashboard />
            </TabsContent>
        </Tabs>

        {/* Request Payment Dialog */}
        <Dialog open={requestDialog} onX={() => setRequestDialog(false)}>
          <Dialog.Header onX={() => setRequestDialog(false)}>
            Request Settlement
          </Dialog.Header>
          <Dialog.Body>
            <div className="mb-6 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--ring)]/10">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--foreground)]/60 mb-1">Active Task Context</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{selectedTask?.title}</p>
            </div>
            <form onSubmit={form.handleSubmit(onRequestSubmit)} className="space-y-6">
              <Input
                label="Requested PKR Amount"
                type="number"
                error={form.formState.errors.amount?.message}
                {...form.register("amount")}
                className="h-11 bg-[var(--muted)]/20"
              />

              <Textarea
                label="Message & Justification (optional)"
                placeholder="Briefly explain the reason for this request or provide milestone context."
                rows={4}
                {...form.register("notes")}
                className="bg-[var(--muted)]/20 resize-none"
              />

              <Dialog.Footer className="px-0 pt-2 bg-transparent border-none">
                <Button variant="ghost" type="button" onClick={() => setRequestDialog(false)} className="font-bold uppercase tracking-tight">
                  Abort
                </Button>
                <Button type="submit" loading={requestMutation.isPending} className="font-bold uppercase tracking-tight px-8 shadow-soft">
                  Submit Request
                </Button>
              </Dialog.Footer>
            </form>
          </Dialog.Body>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default VendorPayments;
