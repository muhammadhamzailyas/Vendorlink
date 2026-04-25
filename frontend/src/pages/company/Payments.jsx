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
  Briefcase,
  Hourglass,
  HandCoins,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { progressAPI } from "@/services/api";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/toast";
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  Dialog,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  PageTransition,
  Loader,
  EmptyState,
  StatCard,
} from "@/components/ui";
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
  const [activeTab, setActiveTab] = useState("tasks");

  const { wallet, refreshWallet, formatCurrency } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: activeTasks = [], isLoading } = useQuery({
    queryKey: ["company", "active-tasks"],
    queryFn: async () => {
      const res = await progressAPI.getCompanyActiveTasks();
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
      setActiveTab("wallet");
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap justify-start gap-1 w-fit mb-8 shadow-inner border border-border/50">
            <TabsTrigger 
                value="tasks"
                className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-soft transition-all"
            >
                <HandCoins className="mr-2 h-3.5 w-3.5" />
                Active Tasks
            </TabsTrigger>
            <TabsTrigger 
                value="wallet"
                className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-soft transition-all"
            >
                <Wallet className="mr-2 h-3.5 w-3.5" />
                Treasury Dashboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Wallet Balance" value={formatCurrency(wallet?.balance)} icon={<Wallet />} />
              <StatCard title="Active Contracts" value={activeTasks.length} icon={<Briefcase />} />
              <StatCard title="Pending Disbursement" value={formatCurrency(pendingTotal)} icon={<Hourglass />} />
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
          </TabsContent>

          <TabsContent value="wallet" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <WalletDashboard />
          </TabsContent>
        </Tabs>

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