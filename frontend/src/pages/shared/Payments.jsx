import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  TrendUp,
  ArrowCircleDown,
  Receipt,
  FileText,
  WarningCircle,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { adminService, progressAPI } from "@/services/api";
import { useWallet } from "@/context/WalletContext";
import toastUtil, { showToast } from "@/lib/toast";
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
  Skeleton,
  Badge,
  DataTable,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui";
import WalletDashboard from "@/components/wallet/WalletDashboard";
import StatusChip from "@/components/shared/StatusChip";
import FormSection from "@/components/shared/FormSection";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import UserAvatar from "@/components/shared/UserAvatar";
import PaymentActionMenu from "@/components/admin/PaymentActionMenu";
import dayjs from "dayjs";
import { cn } from "@/lib/cn";
import { usePageMeta } from "@/hooks/usePageMeta";

// --- SCHEMAS ---
const companyPaymentSchema = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
  paymentType: z.enum(["full", "partial", "milestone", "advance"]),
  notes: z.string().optional(),
});

const vendorRequestSchema = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
  notes: z.string().optional(),
});

// --- SUB-COMPONENTS ---
const ChangeIndicator = ({ value }) => {
    const val = parseFloat(value || 0);
    const isPositive = val > 0;
    const isNegative = val < 0;
    
    const colorClass = isPositive 
        ? "text-success" 
        : isNegative 
            ? "text-error" 
            : "text-muted-foreground";
  
    return (
        <Badge variant="outline" className={cn("gap-1.5 font-bold tracking-widest border-border/40", colorClass)}>
            {isPositive && <CaretUp size={10} weight="bold" />}
            {isNegative && <CaretDown size={10} weight="bold" />}
            <span>{Math.abs(val)}%</span>
            <span className="opacity-70">vs last month</span>
        </Badge>
    );
};

const CaretUp = ({ size, weight }) => <TrendUp size={size} weight={weight} className="rotate-0" />;
const CaretDown = ({ size, weight }) => <TrendUp size={size} weight={weight} className="rotate-180" />;

// --- MAIN COMPONENT ---
const SharedPayments = ({ role }) => {
  usePageMeta(
    role === "admin" ? "Platform Payments" : (role === "company" ? "Make a Payment" : "My Earnings"),
    role === "admin" ? "Monitor all financial transactions and platform revenue" : "Manage your tasks and wallet"
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { wallet, refreshWallet, formatCurrency } = useWallet();

  // Common State
  const [activeTab, setActiveTab] = useState(role === "admin" ? 0 : (role === "company" ? "tasks" : "earnings"));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // --- DATA FETCHING ---
  
  // 1. Admin Stats
  const { data: adminStatsData } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.getStats(),
    enabled: role === "admin",
  });

  // 2. Main Payments Data (Conditional by role)
  const { data, isLoading } = useQuery({
    queryKey: [role, "payment-data", page, activeTab],
    queryFn: async () => {
      if (role === "admin") {
        const statusMap = ["all", "pending", "processing", "completed", "failed", "refunded"];
        const status = statusMap[activeTab];
        const params = { page, limit: 20 };
        if (status !== "all") params.status = status;
        const res = await paymentAPI.getAllPayments(params);
        const d = res?.data?.data;
        return {
          payments: d?.payments || [],
          counts: d?.counts || {},
          totalPages: d?.pagination?.pages || 1,
        };
      } else if (role === "company") {
        const res = await progressAPI.getCompanyActiveTasks();
        return { activeTasks: res?.data?.data || res?.data || [] };
      } else if (role === "vendor") {
        const [tasksRes, summaryRes] = await Promise.all([
          paymentAPI.getVendorActiveTasks(),
          paymentAPI.getVendorPaymentSummary(),
        ]);
        return {
          activeTasks: tasksRes?.data?.data || tasksRes?.data || [],
          summary: summaryRes?.data?.data || null,
        };
      }
      return {};
    },
    onError: () => toastUtil.error("Failed to load payment data"),
  });

  // --- MUTATIONS ---
  
  const paymentMutation = useMutation({
    mutationFn: (data) => paymentAPI.makePayment(data),
    onSuccess: () => {
      showToast("success", "Payment completed successfully!");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [role, "payment-data"] });
      refreshWallet();
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Failed to process payment"),
  });

  const requestMutation = useMutation({
    mutationFn: (data) => paymentAPI.requestPayment(data),
    onSuccess: () => {
      showToast("success", "Payment request sent");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [role, "payment-data"] });
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Failed to send request"),
  });

  const confirmMutation = useMutation({
    mutationFn: (paymentId) => paymentAPI.confirmPayment(paymentId),
    onSuccess: () => {
      showToast("success", "Payment acknowledged!");
      queryClient.invalidateQueries({ queryKey: [role, "payment-data"] });
      refreshWallet();
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Failed to acknowledge"),
  });

  // --- FORMS ---
  const form = useForm({
    resolver: zodResolver(role === "company" ? companyPaymentSchema : vendorRequestSchema),
    defaultValues: { amount: "", paymentType: "full", notes: "" },
  });

  const handleAction = (task) => {
    if (role === "company") {
      if ((wallet?.balance || 0) < task.pendingAmount) {
        showToast("error", `Insufficient balance. Please deposit $${task.pendingAmount - (wallet?.balance || 0)} more.`);
        setActiveTab("wallet");
        return;
      }
      setSelectedTask(task);
      form.reset({ amount: task.pendingAmount, paymentType: "full", notes: "" });
      setDialogOpen(true);
    } else if (role === "vendor") {
      setSelectedTask(task);
      form.reset({ amount: task.pendingAmount, notes: "" });
      setDialogOpen(true);
    }
  };

  const onFormSubmit = (formData) => {
    if (role === "company") {
      if (formData.amount > selectedTask.pendingAmount) {
        form.setError("amount", { message: "Amount cannot exceed pending amount" });
        return;
      }
      if (formData.amount > (wallet?.balance || 0)) {
        form.setError("amount", { message: "Insufficient wallet balance" });
        return;
      }
      paymentMutation.mutate({
        contractId: selectedTask.contractId,
        amount: formData.amount,
        paymentType: formData.paymentType,
        notes: formData.notes,
      });
    } else {
      requestMutation.mutate({
        contractId: selectedTask.contractId,
        amount: formData.amount,
        notes: formData.notes,
      });
    }
  };

  // --- RENDERING HELPERS ---

  const renderStats = () => {
    if (role === "admin") {
      const counts = data?.counts || {};
      const changes = adminStatsData?.data?.changes || {};
      const totalVolume = adminStatsData?.data?.growthData?.reduce((sum, d) => sum + (d.totalVolume || 0), 0) || 0;
      const platformRev = adminStatsData?.data?.growthData?.find(g => g.label === 'Revenue')?.revenue || 0;

      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Transaction Volume"
            value={formatCurrency(totalVolume)}
            icon={<CurrencyDollar />}
            trend={<ChangeIndicator value={changes?.revenue} />}
            noHover
          />
          <StatCard
            title="Platform Revenue"
            value={formatCurrency(platformRev)}
            icon={<HandCoins />}
            noHover
          />
          <StatCard
            title="Pending Payments"
            value={counts.pending || 0}
            icon={<Clock />}
            noHover
          />
          <StatCard
            title="Completed Payments"
            value={counts.completed || 0}
            icon={<CheckCircle />}
            noHover
          />
        </div>
      );
    } else if (role === "company") {
      const activeTasks = data?.activeTasks || [];
      const pendingTotal = activeTasks.reduce((sum, task) => sum + (task.pendingAmount || 0), 0);
      return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Wallet Balance" value={formatCurrency(wallet?.balance)} icon={<Wallet />} />
          <StatCard title="Active Contracts" value={activeTasks.length} icon={<Briefcase />} />
          <StatCard title="Pending Disbursement" value={formatCurrency(pendingTotal)} icon={<Hourglass />} />
        </div>
      );
    } else if (role === "vendor") {
      const summary = data?.summary;
      if (!summary) return null;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Available Balance" value={formatCurrency(summary.availableBalance)} icon={<Wallet />} />
          <StatCard title="Gross Earnings" value={formatCurrency(summary.totalEarned)} icon={<TrendUp />} />
          <StatCard title="Gross Withdrawn" value={formatCurrency(summary.totalWithdrawn)} icon={<ArrowCircleDown />} />
          <StatCard title="Pending Assets" value={formatCurrency(summary.pendingAmount)} icon={<Clock />} />
        </div>
      );
    }
  };

  const adminColumns = [
    {
      key: "invoice",
      label: "Invoice",
      cellClassName: "px-6 py-4",
      render: (p) => <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">{p.invoiceNumber || p._id.slice(-8)}</span>,
    },
    {
        key: "company",
        label: "Company Email",
        cellClassName: "px-6 py-4 text-sm font-medium text-muted-foreground",
        render: (p) => p.companyId?.email || "N/A",
    },
    {
        key: "vendor",
        label: "Vendor Email",
        cellClassName: "px-6 py-4 text-sm font-medium text-muted-foreground",
        render: (p) => p.vendorId?.email || "N/A",
    },
    {
      key: "amount",
      label: "Amount",
      cellClassName: "px-6 py-4 text-sm font-black text-foreground",
      render: (p) => formatCurrency(p.amount),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (p) => <StatusChip status={p.status} />,
    },
    {
      key: "date",
      label: "Date",
      cellClassName: "px-6 py-4 text-sm text-muted-foreground",
      render: (p) => dayjs(p.createdAt).format("MMM DD, YYYY"),
    },
    {
        key: "actions",
        label: "",
        cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
        render: (p) => (
          <PaymentActionMenu
            onView={() => navigate(`/admin/payments/${p._id}`)}
            onDownload={() => paymentAPI.downloadInvoice(p._id)}
            hasInvoice={!!p.invoiceNumber}
          />
        ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {role === "admin" ? (
          <>
            {renderStats()}
            <FilterSearchBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="search by invoice or name"
              activeTab={activeTab}
              onTabChange={(idx) => { setActiveTab(idx); setPage(1); }}
              tabs={["All", "Pending", "Processing", "Completed", "Failed"].map(l => `${l} (${data?.counts?.[l.toLowerCase()] || 0})`)}
            />
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={adminColumns}
                data={(data?.payments || []).filter(p => !search || p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || p.companyId?.companyName?.toLowerCase().includes(search.toLowerCase()))}
                rowKey="_id"
                emptyState={<EmptyState icon={CreditCard} title="No transactions found" description="Platform financial activity will appear here." />}
              />
            )}
            {data?.totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} /></PaginationItem>
                  {Array.from({ length: data.totalPages }).map((_, i) => (
                    <PaginationItem key={i+1}><PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink></PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap justify-start gap-1 w-fit mb-8 shadow-inner border border-border/50">
              <TabsTrigger value={role === "company" ? "tasks" : "earnings"} className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-background">
                <HandCoins className="mr-2 h-3.5 w-3.5" /> {role === "company" ? "Active Tasks" : "Work & Earnings"}
              </TabsTrigger>
              <TabsTrigger value="wallet" className="rounded-lg px-6 py-2.5 font-bold uppercase tracking-tight text-[11px] data-[state=active]:bg-foreground data-[state=active]:text-background">
                <Wallet className="mr-2 h-3.5 w-3.5" /> Treasury Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value={role === "company" ? "tasks" : "earnings"} className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {renderStats()}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
                </div>
              ) : (data?.activeTasks || []).length === 0 ? (
                <EmptyState icon={Receipt} title="No active tasks" description="You'll see tasks here once contracts are active." />
              ) : (
                <div className={cn("grid grid-cols-1 gap-6", role === "company" ? "" : "")}>
                  {(data?.activeTasks || []).map((task) => (
                    role === "company" ? (
                      <FormSection key={task.contractId} title={task.title} description={`Vendor: ${task.vendor?.companyName || task.vendor?.fullName || task.vendor?.email || "—"}`} actions={<StatusChip status={task.paymentStatus} />}>
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 sm:gap-4">
                          <div><p className="text-muted-foreground">Total Budget</p><p className="font-semibold text-foreground">{formatCurrency(task.totalBudget)}</p></div>
                          <div><p className="text-muted-foreground">Paid</p><p className="font-semibold text-success">{formatCurrency(task.totalPaid)}</p></div>
                          <div><p className="text-muted-foreground">Pending</p><p className="font-semibold text-warning-muted-fg">{formatCurrency(task.pendingAmount)}</p></div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${task.totalBudget > 0 ? (task.totalPaid / task.totalBudget) * 100 : 0}%` }} />
                        </div>
                        {task.pendingAmount > 0 && <Button onClick={() => handleAction(task)} className="w-full sm:w-auto"> Pay Now</Button>}
                        {task.payments?.length > 0 && (
                          <div className="rounded-xl border border-border bg-muted/60 p-3 mt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Payments</p>
                            {task.payments.slice(0, 3).map(p => (
                              <div key={p._id} className="flex justify-between items-center bg-card p-2 rounded-lg text-sm mb-1">
                                <span>{p.paymentType}</span><span className="font-bold">{formatCurrency(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </FormSection>
                    ) : (
                      <Card key={task.contractId} className="shadow-soft border-border/50 overflow-hidden">
                        <Card.Header className="pb-4 border-b border-border/50 bg-muted/20">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center shadow-xs"><FileText className="h-5 w-5 text-foreground" /></div>
                              <div><Card.Title className="text-sm font-bold uppercase tracking-tight">{task.title}</Card.Title>
                                <Card.Description className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">Partner</Badge>{task.company?.companyName || task.company?.fullName || task.company?.email}
                                </Card.Description>
                              </div>
                            </div>
                            {task.canRequestPayment ? <Button size="sm" onClick={() => handleAction(task)}>Request Payout</Button> : <StatusChip status="processing" />}
                          </div>
                        </Card.Header>
                        <Card.Content className="p-6">
                           <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                              <div className="p-4 rounded-xl bg-muted/20 border border-border/30"><p className="text-[10px] font-extrabold text-muted-foreground/60 mb-1.5 uppercase">Total Budget</p><p className="text-lg font-extrabold">{formatCurrency(task.totalBudget)}</p></div>
                              <div className="p-4 rounded-xl bg-jade-400/10 border border-jade-600/20"><p className="text-[10px] font-extrabold text-jade-600/60 mb-1.5 uppercase">Gross Received</p><p className="text-lg font-extrabold text-jade-600">{formatCurrency(task.vendorReceived)}</p></div>
                              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20"><p className="text-[10px] font-extrabold text-warning/60 mb-1.5 uppercase">Pending</p><p className="text-lg font-extrabold text-warning">{formatCurrency(task.pendingAmount)}</p></div>
                           </div>
                           {task.payments?.length > 0 && (
                             <div className="mt-6 space-y-2">
                               {task.payments.map(p => (
                                 <div key={p._id} className="flex justify-between items-center p-3 border border-border/50 rounded-xl bg-card">
                                   <div><span className="font-bold block">{formatCurrency(p.vendorAmount)}</span><span className="text-[10px] text-muted-foreground uppercase">{p.paymentType} • {dayjs(p.createdAt).format("MMM D")}</span></div>
                                   {p.status === "completed" && !p.vendorConfirmed ? <Button size="xs" variant="success" onClick={() => confirmMutation.mutate(p._id)} loading={confirmMutation.isPending}>Acknowledge</Button> : <StatusChip status={p.status} />}
                                 </div>
                               ))}
                             </div>
                           )}
                        </Card.Content>
                      </Card>
                    )
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="wallet" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <WalletDashboard />
            </TabsContent>
          </Tabs>
        )}

        {/* --- DIALOGS --- */}
        <Dialog open={dialogOpen} onX={() => setDialogOpen(false)} className="max-w-lg">
          <Dialog.Header onX={() => setDialogOpen(false)}>
            {role === "company" ? "Make Payment" : "Request Payout"}
          </Dialog.Header>
          <Dialog.Body>
            <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-ring/10">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/60 mb-1">Active Task Context</p>
                <p className="text-sm font-bold text-foreground">{selectedTask?.title}</p>
            </div>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
              <Input label="Amount ($)" type="number" error={form.formState.errors.amount?.message} {...form.register("amount")} />
              {role === "company" && (
                <Select label="Payment Type" options={[{ value: "full", label: "Full Payment" }, { value: "partial", label: "Partial" }, { value: "milestone", label: "Milestone" }, { value: "advance", label: "Advance" }]} {...form.register("paymentType")} />
              )}
              <Textarea label="Notes (optional)" rows={3} {...form.register("notes")} />
              
              {role === "company" && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <div className="flex justify-between"><span>Amount</span><span>${parseFloat(form.watch("amount") || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Platform Fee (5%)</span><span>${(parseFloat(form.watch("amount") || 0) * 0.05).toLocaleString()}</span></div>
                  <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Vendor Receives</span><span>${(parseFloat(form.watch("amount") || 0) * 0.95).toLocaleString()}</span></div>
                </div>
              )}

              <Dialog.Footer className="px-0 bg-transparent border-none pt-4">
                <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" loading={paymentMutation.isPending || requestMutation.isPending}>Confirm {role === "company" ? "Payment" : "Request"}</Button>
              </Dialog.Footer>
            </form>
          </Dialog.Body>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default SharedPayments;
