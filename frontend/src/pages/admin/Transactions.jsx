import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowsDownUp as ArrowUpDown,
  CheckCircle,
  XCircle,
  ArrowCircleDown as ArrowDownCircle,
  ArrowCircleUp as ArrowUpCircle,
  CreditCard,
  CurrencyDollar,
  ListChecks,
  Sparkle
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { showToast } from "@/lib/toast";
import { 
  Button, 
  PageTransition, 
  Skeleton, 
  EmptyState, 
  DataTable, 
  Badge,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import UserAvatar from "@/components/shared/UserAvatar";
import dayjs from "dayjs";
import { cn } from "@/lib/cn";

const typeIcons = {
  deposit: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  payment: CreditCard,
  refund: CurrencyDollar,
  platform_fee: ListChecks,
  subscription: Sparkle,
};

import { usePageMeta } from "@/hooks/usePageMeta";

const AdminTransactions = () => {
  usePageMeta("Transactions", "Complete chronological record of all platform monetary movements");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "transactions", page, activeTab],
    queryFn: async () => {
      const typeMap = ["all", "deposit", "withdrawal", "payment", "subscription", "refund", "platform_fee"];
      const type = typeMap[activeTab];
      const params = { page, limit: 20 };
      if (type !== "all") params.type = type;
      
      const res = await paymentAPI.getAllTransactions(params);
      const d = res?.data?.data;
      return {
        transactions: d?.transactions || [],
        counts: d?.counts || {},
        totalPages: d?.pagination?.pages || 1,
        totalCount: d?.pagination?.total || 0
      };
    },
    onError: () => showToast("error", "Failed to load transactions"),
  });

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;
  const counts = data?.counts || {};

  const withdrawalMutation = useMutation({
    mutationFn: ({ transactionId, status, adminNotes }) => 
        paymentAPI.processWithdrawal({ transactionId, status, adminNotes }),
    onSuccess: (_, { status }) => {
      showToast("success", `Withdrawal ${status === "completed" ? "approved" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
    },
    onError: (error) => {
      showToast("error", error.response?.data?.error || "Failed to process withdrawal");
    },
  });

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((t) => {
      if (!q) return true;
      const fromName = t.fromUserId?.companyName || t.fromUserId?.fullName || t.fromUserId?.email || "";
      const toName = t.toUserId?.companyName || t.toUserId?.fullName || t.toUserId?.email || "";
      return (
        t.invoiceNumber?.toLowerCase().includes(q) ||
        fromName.toLowerCase().includes(q) ||
        toName.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  const transactionColumns = [
    {
        key: "type",
        label: "Type",
        cellClassName: "px-6 py-4",
        render: (t) => {
          const Icon = typeIcons[t.type] || ArrowUpDown;
          return (
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted">
                    <Icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">{t.type.replace('_', ' ')}</span>
            </div>
          );
        },
    },
    {
      key: "user",
      label: "Initiator",
      cellClassName: "px-6 py-4",
      render: (t) => {
          const target = t.fromUserId || t.toUserId;
          if (!target) {
            return <span className="text-sm font-bold text-muted-foreground">System</span>;
          }
          
          const displayName = target.companyName || target.fullName || "N/A";
          const displayEmail = target.email;

          return (
            <div className="flex items-center gap-3">
              <UserAvatar user={target} name={displayName} size="sm" />
              <div>
                <p className="text-sm font-bold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail || 'No Email'}</p>
              </div>
            </div>
          );
      }
    },
    {
      key: "amount",
      label: "Amount",
      cellClassName: "px-6 py-4 text-sm font-black text-foreground",
      render: (t) => (
        <span className={cn(
            t.type === "deposit" || t.type === "refund" ? "text-success" : "text-foreground"
        )}>
          {t.type === "deposit" || t.type === "refund" ? "+" : "-"}${t.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (t) => <StatusChip status={t.status} />,
    },
    {
      key: "description",
      label: "Description",
      cellClassName: "px-6 py-4 text-xs font-medium text-muted-foreground max-w-xs truncate",
      render: (t) => t.description || "—",
    },
    {
      key: "date",
      label: "Date",
      cellClassName: "px-6 py-4 text-sm text-muted-foreground",
      render: (t) => dayjs(t.createdAt).format("MMM DD, YYYY"),
    },
    {
        key: "actions",
        label: "",
        headerClassName: "relative px-6 py-3",
        cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
        render: (t) => {
            const isWithdrawalPending = t.type === "withdrawal" && t.status === "pending";
            if (!isWithdrawalPending) return null;
            return (
                <div className="grid-cols-2 grid gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => withdrawalMutation.mutate({ transactionId: t._id, status: "completed", adminNotes: "Approved by admin" })}
                        disabled={withdrawalMutation.isPending}
                        className="w-full h-8 w-8 p-0 rounded-full text-success hover:bg-success/10"
                    >
                        <CheckCircle weight="bold" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => withdrawalMutation.mutate({ transactionId: t._id, status: "failed", adminNotes: "Rejected by admin" })}
                        disabled={withdrawalMutation.isPending}
                        className="w-full h-8 w-8 p-0 rounded-full text-danger hover:bg-danger/10"
                    >
                        <XCircle weight="bold" />
                    </Button></div>
            );
        },
    },
  ];

  const tabOptions = [
    { label: "All Activity", count: counts.all || 0 },
    { label: "Deposits", count: counts.deposit || 0 },
    { label: "Withdrawals", count: counts.withdrawal || 0 },
    { label: "Payments", count: counts.payment || 0 },
    { label: "Subscriptions", count: counts.subscription || 0 },
    { label: "Refunds", count: counts.refund || 0 },
    { label: "Fees", count: counts.platform_fee || 0 },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <FilterSearchBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search transactions by ID, initiator or status..."
            activeTab={activeTab}
            onTabChange={(idx) => { setActiveTab(idx); setPage(1); }}
            tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
        />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={transactionColumns}
            data={filteredTransactions}
            rowKey="_id"
            emptyState={
              <EmptyState
                icon={ArrowUpDown}
                title="No transactions found"
                description={search ? "Try adjusting your search criteria" : "Financial logs will populate as transactions occur."}
                className="border-0 bg-transparent py-16 shadow-none"
              />
            }
          />
        )}

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (totalPages > 7) {
                    if (p !== 1 && p !== totalPages && (p < page - 1 || p > page + 1)) {
                        if (p === page - 2 || p === page + 2) {
                            return (
                                <PaginationItem key={p}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            );
                        }
                        return null;
                    }
                }

                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={page === p}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminTransactions;
