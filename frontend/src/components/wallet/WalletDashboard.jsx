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
import { Button, Input, Card, EmptyState, DataTable, StatCard, Badge, Dialog } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import dayjs from "dayjs";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const depositSchema = z.object({
  amount: z.coerce.number().min(10, "Minimum deposit is $10"),
});

const withdrawSchema = z.object({
  amount: z.coerce.number().min(5, "Minimum withdrawal is $5"),
  accountNumber: z.string().min(5, "Account number required"),
  expiryMonth: z.string().min(2, "MM"),
  expiryYear: z.string().min(2, "YY"),
  cvc: z.string().min(3, "CVC required"),
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
    defaultValues: { amount: "", accountNumber: "", expiryMonth: "", expiryYear: "", cvc: "" },
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

      <div className="grid-cols-2 grid gap-4">
        <Button onClick={() => setShowDeposit(true)} className="w-full h-12 px-6 font-bold uppercase tracking-tight">
           Load Wallet
        </Button>
        <Button onClick={() => setShowWithdraw(true)} variant="secondary" className="w-full h-12 px-6 font-bold uppercase tracking-tight">
           Request Payout
        </Button></div>

      <Card className="shadow-soft border-border/50">
          <Card.Header className="pb-4 border-b border-border/50 bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                      <Card.Title className="text-sm font-bold uppercase tracking-tight">Ledger & Pulse</Card.Title>
                      <Card.Description className="text-xs">Latest wallet activity and transfer records.</Card.Description>
                  </div>
                  <Button variant="outline" size="xs" onClick={refreshWallet} className="font-semibold uppercase tracking-tight bg-card">
                      
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
                  </>
              )}
          </Card.Content>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onX={() => setShowDeposit(false)} className="max-w-md">
        <Dialog.Header onX={() => setShowDeposit(false)}>
            <Dialog.Title>Load Wallet</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
            <form onSubmit={depositForm.handleSubmit(onDeposit)} className="space-y-4">
                <Input label="Amount ($)" type="number" {...depositForm.register("amount")} />
                <div className="p-3 border border-border/50 rounded-lg bg-card"><CardElement /></div>
                <Button type="submit" loading={processing} className="w-full">Finalize Deposit</Button>
            </form>
        </Dialog.Body>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onX={() => setShowWithdraw(false)} className="max-w-md">
        <Dialog.Header onX={() => setShowWithdraw(false)}>
            <Dialog.Title>Request Payout</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
            <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-4">
                <Input label="Amount ($)" type="number" {...withdrawForm.register("amount")} />
                <Input label="Card Number" {...withdrawForm.register("accountNumber")} />
                <Input label="MM" {...withdrawForm.register("expiryMonth")} />
                <Input label="YY" {...withdrawForm.register("expiryYear")} />
                <Input label="CVC" {...withdrawForm.register("cvc")} />
                <Button type="submit" loading={withdrawMutation.isPending} className="w-full">Initiate Payout</Button>
            </form>
        </Dialog.Body>
      </Dialog>
    </div>
  );
};

export default WalletDashboard;
