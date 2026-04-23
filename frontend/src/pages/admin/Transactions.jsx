import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowsDownUp as ArrowUpDown,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  ArrowCircleDown as ArrowDownCircle,
  ArrowCircleUp as ArrowUpCircle,
  CreditCard,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { showToast } from "@/lib/toast";
import { Button, Input, Select, PageTransition, Skeleton, EmptyState, DataTable, Loader } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import dayjs from "dayjs";

const typeIcons = {
  deposit: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  payment: CreditCard,
  refund: CurrencyDollar,
};

const typeColors = {
  deposit: "text-success bg-success-surface",
  withdrawal: "text-warning bg-warning-light",
  payment: "text-info bg-info-light",
  refund: "text-purple-600 bg-purple-50",
  fee: "text-[var(--muted-foreground)] bg-[var(--muted)]",
};

const AdminTransactions = () => {
  const [filters, setFilters] = useState({ type: "", status: "", search: "" });
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "transactions", page, filters.type, filters.status],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      const res = await paymentAPI.getAllTransactions(params);
      const data = res?.data?.data;
      return {
        transactions: data?.transactions || [],
        totalPages: data?.pagination?.pages || 1,
      };
    },
    onError: () => showToast("error", "Failed to load transactions"),
  });

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;

  const withdrawalMutation = useMutation({
    mutationFn: ({ transactionId, action }) => paymentAPI.processWithdrawal(transactionId, { action }),
    onSuccess: (_, { action }) => {
      showToast("success", `Withdrawal ${action === "approve" ? "approved" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
    },
    onError: (error, { action }) => {
      showToast("error", error.response?.data?.error || `Failed to ${action} withdrawal`);
    },
  });

  const filteredTransactions = transactions.filter((t) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      t.invoiceNumber?.toLowerCase().includes(q) ||
      t.user?.username?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  });

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]/70" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.type}
            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="payment">Payment</option>
            <option value="refund">Refund</option>
            <option value="fee">Fee</option>
          </Select>
          <Select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <Loader />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState icon={ArrowUpDown} title="No transactions found" description="No transactions match your filters" />
        ) : (
          <DataTable
            data={filteredTransactions}
            columns={[
              {
                key: "type",
                label: "Type",
                render: (t) => {
                  const Icon = typeIcons[t.type] || ArrowUpDown;
                  const color = typeColors[t.type] || "text-[var(--muted-foreground)] bg-[var(--muted)]";
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {t.type}
                    </span>
                  );
                },
              },
              {
                key: "invoiceNumber",
                label: "Invoice",
                render: (t) => <span className="font-mono text-xs">{t.invoiceNumber || "-"}</span>,
              },
              {
                key: "user",
                label: "User",
                render: (t) => t.user?.username || "-",
              },
              {
                key: "amount",
                label: "Amount",
                render: (t) => (
                  <span className={`font-semibold ${t.type === "deposit" || t.type === "refund" ? "text-success" : ""}`}>
                    {t.type === "deposit" || t.type === "refund" ? "+" : "-"}PKR {t.amount?.toLocaleString()}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (t) => <StatusChip status={t.status} />,
              },
              {
                key: "description",
                label: "Description",
                cellClassName: "max-w-xs truncate px-4 sm:px-6 py-3 sm:py-4 text-sm text-[var(--muted-foreground)]",
                render: (t) => t.description || "-",
              },
              {
                key: "createdAt",
                label: "Date",
                render: (t) => <span className="text-[var(--muted-foreground)]">{dayjs(t.createdAt).format("MMM D, YYYY")}</span>,
              },
            ]}
            showRowActions
            actionsHeaderLabel="Actions"
            rowActions={(t) => {
              const isWithdrawalPending = t.type === "withdrawal" && t.status === "pending";
              if (!isWithdrawalPending) return [];
              return [
                {
                  key: "approve",
                  label: "Approve",
                  title: "Approve",
                  icon: <CheckCircle className="h-3.5 w-3.5" />,
                  onClick: () => withdrawalMutation.mutate({ transactionId: t._id, action: "approve" }),
                  disabled: withdrawalMutation.isPending,
                  className: "h-auto whitespace-nowrap px-2.5 py-1.5 text-xs text-success",
                },
                {
                  key: "reject",
                  label: "Reject",
                  title: "Reject",
                  icon: <XCircle className="h-3.5 w-3.5" />,
                  onClick: () => withdrawalMutation.mutate({ transactionId: t._id, action: "reject" }),
                  disabled: withdrawalMutation.isPending,
                  className: "h-auto whitespace-nowrap px-2.5 py-1.5 text-danger",
                },
              ];
            }}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-[var(--muted-foreground)]">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AdminTransactions;
