import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  CreditCard,
  PaperPlaneTilt as Send,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/toast";
import { Button, Input, Select, Textarea, Card, Dialog, Tabs, PageTransition, Loader, EmptyState } from "@/components/ui";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import StatusChip from "@/components/shared/StatusChip";
import FormSection from "@/components/shared/FormSection";
import dayjs from "dayjs";

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
  paymentType: z.enum(["full", "partial", "milestone", "advance"]),
  notes: z.string().optional(),
});

const CompanyPayments = () => {
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const { wallet, refreshWallet, formatCurrency } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: activeTasks = [], isLoading } = useQuery({
    queryKey: ["company", "active-tasks"],
    queryFn: async () => {
      const res = await paymentAPI.getCompanyActiveTasks();
      return res?.data?.data || res?.data || [];
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        showToast("error", "Session expired. Please login again.");
        navigate("/login");
      } else {
        showToast("error", "Failed to load tasks");
      }
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data) => paymentAPI.makePayment(data),
    onSuccess: () => {
      showToast("success", "Payment completed successfully!");
      setPaymentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["company", "active-tasks"] });
      refreshWallet();
    },
    onError: (error) => {
      showToast("error", error.response?.data?.error || "Failed to process payment");
    },
  });

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: "", paymentType: "full", notes: "" },
  });

  const handleMakePayment = (task) => {
    if ((wallet?.balance || 0) < task.pendingAmount) {
      showToast("error", `Insufficient balance. Please deposit $${task.pendingAmount - (wallet?.balance || 0)} more.`);
      setTabValue(1);
      return;
    }
    setSelectedTask(task);
    form.reset({ amount: task.pendingAmount, paymentType: "full", notes: "" });
    setPaymentDialog(true);
  };

  const onPaymentSubmit = (data) => {
    if (data.amount > selectedTask.pendingAmount) {
      form.setError("amount", { message: "Amount cannot exceed pending amount" });
      return;
    }
    if (data.amount > (wallet?.balance || 0)) {
      form.setError("amount", { message: "Insufficient wallet balance" });
      return;
    }
    paymentMutation.mutate({
      contractId: selectedTask.contractId,
      amount: data.amount,
      paymentType: data.paymentType,
      notes: data.notes,
    });
  };

  const watchAmount = form.watch("amount") || 0;
  const pendingTotal = activeTasks.reduce((sum, task) => sum + (task.pendingAmount || 0), 0);

  return (
    <PageTransition>
      <div className="space-y-8">
        <Tabs value={tabValue} onChange={setTabValue} tabs={["Active Tasks", "Wallet"]} />

        {/* Tab: Active Tasks */}
        {tabValue === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <Card.Content className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(wallet?.balance)}</p>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Contracts</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{activeTasks.length}</p>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Disbursement</p>
                  <p className="mt-1 text-2xl font-bold text-warning-muted-fg">{formatCurrency(pendingTotal)}</p>
                </Card.Content>
              </Card>
            </div>

            {isLoading ? (
              <Loader />
            ) : activeTasks.length === 0 ? (
              <EmptyState icon={CreditCard} title="No active tasks" description="No active tasks with pending payments" />
            ) : (
              <div className="space-y-4">
                {activeTasks.map((task) => (
                  <FormSection
                    key={task.contractId}
                    title={task.title}
                    description={`Vendor: ${task.vendor?.companyName || task.vendor?.username || "—"}`}
                    actions={<StatusChip status={task.paymentStatus} />}
                  >
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 sm:gap-4">
                      <div>
                        <p className="text-muted-foreground">Total Budget</p>
                        <p className="font-semibold text-foreground">{formatCurrency(task.totalBudget)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-semibold text-success">{formatCurrency(task.totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-semibold text-warning-muted-fg">{formatCurrency(task.pendingAmount)}</p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${task.totalBudget > 0 ? (task.totalPaid / task.totalBudget) * 100 : 0}%` }}
                      />
                    </div>

                    {task.pendingAmount > 0 ? (
                      <Button onClick={() => handleMakePayment(task)} className="w-full sm:w-auto">
                        <Send className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    ) : null}

                    {task.payments && task.payments.length > 0 ? (
                      <div className="rounded-xl border border-border bg-muted/60 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment History</p>
                        <div className="space-y-2">
                          {task.payments.slice(0, 3).map((p) => (
                            <div key={p._id} className="flex flex-col items-start justify-between gap-1.5 rounded-lg bg-input-bg px-3 py-2 text-sm sm:flex-row sm:items-center sm:gap-2">
                              <div className="flex items-center gap-2">
                                {p.status === "completed" ? (
                                  <CheckCircle className="h-4 w-4 text-success" />
                                ) : (
                                  <Clock className="h-4 w-4 text-warning-muted-fg" />
                                )}
                                <span className="capitalize">{p.paymentType}</span>
                              </div>
                              <span className="font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                              <span className="text-muted-foreground/70">{dayjs(p.createdAt).format("MMM D")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </FormSection>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Wallet */}
        {tabValue === 1 && <WalletDashboard />}

        {/* Payment Dialog */}
        <Dialog open={paymentDialog} onX={() => setPaymentDialog(false)} className="max-w-lg">
          <Dialog.Header onX={() => setPaymentDialog(false)}>
            <Dialog.Title>Make Payment</Dialog.Title>
            <Dialog.Description>{selectedTask?.title}</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <form onSubmit={form.handleSubmit(onPaymentSubmit)} className="space-y-4">
            <Input
              label="Amount ($)"
              type="number"
              placeholder={`Max: ${selectedTask?.pendingAmount}`}
              error={form.formState.errors.amount?.message}
              {...form.register("amount")}
            />

            <Select
              label="Payment Type"
              options={[
                { value: "full", label: "Full Payment" },
                { value: "partial", label: "Partial Payment" },
                { value: "milestone", label: "Milestone" },
                { value: "advance", label: "Advance" },
              ]}
              {...form.register("paymentType")}
            />

            <Textarea
              label="Notes (optional)"
              rows={2}
              {...form.register("notes")}
            />

            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span>${parseFloat(watchAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee (5%)</span>
                <span>${(parseFloat(watchAmount || 0) * 0.05).toLocaleString()}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold">
                <span>Vendor Receives</span>
                <span>${(parseFloat(watchAmount || 0) * 0.95).toLocaleString()}</span>
              </div>
            </div>

            <Dialog.Footer>
              <Button variant="secondary" type="button" onClick={() => setPaymentDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={paymentMutation.isPending}>
                Confirm Payment
              </Button>
            </Dialog.Footer>
            </form>
          </Dialog.Body>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default CompanyPayments;




