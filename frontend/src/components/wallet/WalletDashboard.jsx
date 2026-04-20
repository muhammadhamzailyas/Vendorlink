import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wallet,
  ArrowCircleUp,
  ArrowCircleDown,
  Clock,
  ArrowsClockwise,
  Receipt,
  ShieldCheck,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/toast";
import { Button, Input, Select, Card, EmptyState, DataTable, StatCard, Badge, Separator } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FormSection, { FormFieldGrid } from "@/components/shared/FormSection";
import dayjs from "dayjs";

const depositSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum deposit is PKR 100"),
  paymentMethod: z.enum(["bank_transfer", "jazzcash", "easypaisa"]),
});

const withdrawSchema = z.object({
  amount: z.coerce.number().min(500, "Minimum withdrawal is PKR 500"),
  paymentMethod: z.enum(["bank_transfer", "jazzcash", "easypaisa"]),
});

const WalletDashboard = () => {
  const { wallet, transactions, loading, refreshWallet, formatCurrency } = useWallet();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const depositForm = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: "", paymentMethod: "bank_transfer" },
  });

  const withdrawForm = useForm({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: "", paymentMethod: "bank_transfer" },
  });

  const depositMutation = useMutation({
    mutationFn: (data) => paymentAPI.depositMoney(data),
    onSuccess: (_, data) => {
      showToast("success", `PKR ${data.amount.toLocaleString()} deposited successfully`);
      depositForm.reset();
      setShowDeposit(false);
      refreshWallet();
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Deposit failed"),
  });

  const withdrawMutation = useMutation({
    mutationFn: (data) => paymentAPI.requestWithdrawal({ ...data, accountDetails: {} }),
    onSuccess: () => {
      showToast("success", "Withdrawal request submitted");
      withdrawForm.reset();
      setShowWithdraw(false);
      refreshWallet();
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Withdrawal failed"),
  });

  const onDeposit = (data) => depositMutation.mutate(data);

  const onWithdraw = (data) => {
    if (data.amount > (wallet?.balance || 0)) {
      withdrawForm.setError("amount", { message: "Insufficient balance" });
      return;
    }
    withdrawMutation.mutate(data);
  };

  const typeColors = {
    deposit: "success",
    payment: "info",
    withdrawal: "warning",
    refund: "info",
    fee: "error",
    transfer: "outline",
  };

  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "jazzcash", label: "JazzCash" },
    { value: "easypaisa", label: "EasyPaisa" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--ring)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Available Balance" value={formatCurrency(wallet?.balance)} icon={<Wallet />} />
        <StatCard title="Locked Assets" value={formatCurrency(wallet?.lockedBalance)} icon={<Clock />} />
        <StatCard title="Gross Deposits" value={formatCurrency(wallet?.totalDeposited)} icon={<ArrowCircleUp />} />
        <StatCard title="Gross Outflow" value={formatCurrency(wallet?.totalWithdrawn)} icon={<ArrowCircleDown />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-soft border-[var(--border)]/50">
                <Card.Header className="pb-4 border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <Card.Title className="text-sm font-bold uppercase tracking-tight">Ledger & Pulse</Card.Title>
                            <Card.Description className="text-xs">Latest wallet activity and transfer records.</Card.Description>
                        </div>
                        <Button variant="outline" size="xs" onClick={refreshWallet} className="font-bold uppercase tracking-tight bg-[var(--card)]">
                            <ArrowsClockwise className="h-3.5 w-3.5 mr-1.5" />
                            Sync Wallet
                        </Button>
                    </div>
                </Card.Header>
                <Card.Content className="p-0">
                    {transactions.length === 0 ? (
                        <EmptyState
                        icon={Receipt}
                        title="No transactions recorded"
                        description="Your financial activity will appear here as you interact with the platform."
                        className="border-0 bg-transparent py-16"
                        />
                    ) : (
                        <DataTable
                            data={transactions}
                            sectionClassName="border-0 bg-transparent shadow-none"
                            contentWrapperClassName="overflow-x-auto"
                            tableClassName="w-full"
                            showTableHeader
                            columns={[
                                {
                                key: "type",
                                label: "Type",
                                cellClassName: "px-6 py-4",
                                render: (txn) => (
                                    <Badge variant={typeColors[txn.type] || "outline"} className="font-bold uppercase tracking-widest text-[9px] px-2">
                                    {txn.type}
                                    </Badge>
                                ),
                                },
                                {
                                key: "amount",
                                label: "Amount",
                                cellClassName: "px-6 py-4",
                                render: (txn) => <span className="font-extrabold tracking-tighter text-[var(--foreground)] uppercase">PKR {txn.amount?.toLocaleString()}</span>,
                                },
                                {
                                key: "status",
                                label: "Status",
                                cellClassName: "px-6 py-4",
                                render: (txn) => <StatusChip status={txn.status} />,
                                },
                                {
                                key: "createdAt",
                                label: "Timestamp",
                                cellClassName: "px-6 py-4",
                                render: (txn) => <span className="text-[var(--muted-foreground)] font-bold text-[11px] uppercase">{dayjs(txn.createdAt).format("MMM D, YYYY")}</span>,
                                },
                            ]}
                        />
                    )}
                </Card.Content>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="shadow-soft border-[var(--border)]/50">
                <Card.Header className="pb-3 border-b border-[var(--border)]/50 bg-[var(--muted)]/20 px-5 py-4">
                    <Card.Title className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[var(--foreground)]" />
                        Treasury Actions
                    </Card.Title>
                </Card.Header>
                <Card.Content className="p-5 space-y-6">
                    <div className="flex flex-col gap-3">
                        <Button
                            variant={showDeposit ? "primary" : "secondary"}
                            className="w-full justify-start h-12 rounded-xl font-bold uppercase tracking-tight shadow-xs px-4"
                            onClick={() => { setShowDeposit(!showDeposit); setShowWithdraw(false); }}
                        >
                            <ArrowCircleUp className="h-5 w-5 mr-3 text-success" />
                            Load Wallet
                        </Button>
                        <Button
                            variant={showWithdraw ? "primary" : "secondary"}
                            className="w-full justify-start h-12 rounded-xl font-bold uppercase tracking-tight shadow-xs px-4"
                            onClick={() => { setShowWithdraw(!showWithdraw); setShowDeposit(false); }}
                        >
                            <ArrowCircleDown className="h-5 w-5 mr-3 text-warning" />
                            Request Payout
                        </Button>
                    </div>

                    {(showDeposit || showWithdraw) && <Separator className="opacity-50" />}

                    {showDeposit && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]/60">Load Capital</p>
                            <form onSubmit={depositForm.handleSubmit(onDeposit)} className="space-y-4">
                                <Input
                                    label="PKR Amount"
                                    type="number"
                                    placeholder="Min 100"
                                    error={depositForm.formState.errors.amount?.message}
                                    {...depositForm.register("amount")}
                                    className="h-11 bg-[var(--muted)]/20"
                                />
                                <Select
                                    label="Gateway"
                                    options={paymentMethods}
                                    {...depositForm.register("paymentMethod")}
                                    className="h-11 bg-[var(--muted)]/20"
                                />
                                <Button type="submit" loading={depositMutation.isPending} className="w-full font-bold uppercase tracking-tight h-11">
                                    Finalize Deposit
                                </Button>
                            </form>
                        </div>
                    )}

                    {showWithdraw && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted-foreground)]/60">Asset Liquidation</p>
                            <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-4">
                                <Input
                                    label="PKR Amount"
                                    type="number"
                                    placeholder="Min 500"
                                    error={withdrawForm.formState.errors.amount?.message}
                                    {...withdrawForm.register("amount")}
                                    className="h-11 bg-[var(--muted)]/20"
                                />
                                <Select
                                    label="Payout Method"
                                    options={paymentMethods}
                                    {...withdrawForm.register("paymentMethod")}
                                    className="h-11 bg-[var(--muted)]/20"
                                />
                                <Button type="submit" loading={withdrawMutation.isPending} variant="primary" className="w-full font-bold uppercase tracking-tight h-11 bg-warning hover:bg-warning-dark border-none">
                                    Initiate Payout
                                </Button>
                            </form>
                        </div>
                    )}
                </Card.Content>
            </Card>

            <Card className="border-[var(--ring)]/10 bg-[var(--muted)]/10 shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold leading-relaxed text-[var(--muted-foreground)] uppercase tracking-tight italic">
                        All transactions are processed through encrypted channels and verified by the treasury audit team before settlement.
                    </p>
                </Card.Content>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
