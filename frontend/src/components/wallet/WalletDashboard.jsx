import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button, Input, Card, EmptyState, DataTable, StatCard, Badge, Separator } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import dayjs from "dayjs";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const depositSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum deposit is $10"),
});

const withdrawSchema = z.object({
  amount: z.coerce.number().min(5, "Minimum withdrawal is $5"),
  accountNumber: z.string().min(5, "Account number required"),
});

const WalletDashboard = () => {
  const { wallet, transactions, pagination, loading, refreshWallet, loadWallet, formatCurrency } = useWallet();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [processing, setProcessing] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  const depositForm = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: { amount: "" },
  });

  const withdrawForm = useForm({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: "", accountNumber: "" },
  });

  const depositMutation = useMutation({
    mutationFn: (data) => paymentAPI.depositMoney(data),
    onSuccess: (_, data) => {
      showToast("success", `$${data.amount.toLocaleString()} deposited successfully`);
      depositForm.reset();
      setShowDeposit(false);
      refreshWallet();
      setProcessing(false);
    },
    onError: (error) => {
      showToast("error", error.response?.data?.error || "Deposit failed");
      setProcessing(false);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data) => paymentAPI.requestWithdrawal({ ...data, paymentMethod: 'stripe' }),
    onSuccess: () => {
      showToast("success", "Withdrawal request submitted");
      withdrawForm.reset();
      setShowWithdraw(false);
      refreshWallet();
    },
    onError: (error) => showToast("error", error.response?.data?.error || "Withdrawal failed"),
  });

  const onDeposit = async (data) => {
    if (!stripe || !elements) return;
    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
    });

    if (error) {
        showToast("error", error.message);
        setProcessing(false);
        return;
    }

    depositMutation.mutate({ amount: data.amount, paymentMethodId: paymentMethod.id });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ring border-t-transparent" />
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
            <Card className="shadow-soft border-border/50">
                <Card.Header className="pb-4 border-b border-border/50 bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <Card.Title className="text-sm font-bold uppercase tracking-tight">Ledger & Pulse</Card.Title>
                            <Card.Description className="text-xs">Latest wallet activity and transfer records.</Card.Description>
                        </div>
                        <Button variant="outline" size="xs" onClick={refreshWallet} className="font-bold uppercase tracking-tight bg-card">
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
                        <>
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
                                    render: (txn) => <span className="font-extrabold tracking-tighter text-foreground uppercase">${txn.amount?.toLocaleString()}</span>,
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
                                    render: (txn) => <span className="text-muted-foreground font-bold text-[11px] uppercase">{dayjs(txn.createdAt).format("MMM D, YYYY")}</span>,
                                    },
                                ]}
                            />
                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Page {pagination.currentPage} of {pagination.pages}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="xs" 
                                            disabled={pagination.currentPage <= 1}
                                            onClick={() => loadWallet(pagination.currentPage - 1)}
                                            className="h-8 px-3 font-bold uppercase tracking-tight text-[10px]"
                                        >
                                            Prev
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="xs" 
                                            disabled={pagination.currentPage >= pagination.pages}
                                            onClick={() => loadWallet(pagination.currentPage + 1)}
                                            className="h-8 px-3 font-bold uppercase tracking-tight text-[10px]"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card.Content>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="shadow-soft border-border/50">
                <Card.Header className="pb-3 border-b border-border/50 bg-muted/20 px-5 py-4">
                    <Card.Title className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
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
                            Load Wallet (Stripe)
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
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Load Capital via Stripe</p>
                            <form onSubmit={depositForm.handleSubmit(onDeposit)} className="space-y-4">
                                <Input
                                    label="USD Amount"
                                    type="number"
                                    placeholder="Min 10"
                                    error={depositForm.formState.errors.amount?.message}
                                    {...depositForm.register("amount")}
                                    className="h-11 bg-muted/20"
                                />
                                <div className="p-3 border border-border/50 rounded-lg bg-card">
                                    <CardElement />
                                </div>
                                <Button type="submit" loading={processing} className="w-full font-bold uppercase tracking-tight h-11">
                                    Finalize Deposit
                                </Button>
                            </form>
                        </div>
                    )}

                    {showWithdraw && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">Asset Liquidation</p>
                            <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-4">
                                <Input
                                    label="USD Amount"
                                    type="number"
                                    placeholder="Min 5"
                                    error={withdrawForm.formState.errors.amount?.message}
                                    {...withdrawForm.register("amount")}
                                    className="h-11 bg-muted/20"
                                />
                                <Input
                                    label="Bank/Stripe Account Number"
                                    placeholder="e.g., 1234567890"
                                    error={withdrawForm.formState.errors.accountNumber?.message}
                                    {...withdrawForm.register("accountNumber")}
                                    className="h-11 bg-muted/20"
                                />
                                <Button type="submit" loading={withdrawMutation.isPending} variant="primary" className="w-full font-bold uppercase tracking-tight h-11 bg-warning hover:bg-warning-dark border-none">
                                    Initiate Payout
                                </Button>
                            </form>
                        </div>
                    )}
                </Card.Content>
            </Card>

            <Card className="border-ring/10 bg-muted/10 shadow-none">
                <Card.Content className="p-4">
                    <p className="text-[10px] font-bold leading-relaxed text-muted-foreground uppercase tracking-tight italic">
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
