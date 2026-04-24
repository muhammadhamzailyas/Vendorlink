import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  TrendUp,
  Clock,
  WarningCircle,
  Eye,
  Download,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { showToast } from "@/lib/toast";
import { 
  Button, 
  Input, 
  Select, 
  Card, 
  PageTransition, 
  Skeleton, 
  EmptyState, 
  DataTable, 
  StatCard, 
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
import dayjs from "dayjs";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.payments)) return value.payments;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const AdminPayments = () => {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "payments", page, filters.status],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      const res = await paymentAPI.getAllPayments(params);
      const d = res?.data;
      const payments = toArray(d?.data ?? d);
      return {
        payments,
        totalPages: d?.totalPages || 1,
        stats: d?.stats || null,
      };
    },
    onError: () => showToast("error", "Failed to load payments"),
  });

  const payments = Array.isArray(data?.payments) ? data.payments : [];
  const totalPages = data?.totalPages || 1;
  const stats = data?.stats;

  const handleDownloadInvoice = async (paymentId) => {
    try {
      await paymentAPI.downloadInvoice(paymentId);
    } catch {
      showToast("error", "Failed to download invoice");
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      p.invoiceNumber?.toLowerCase().includes(q) ||
      p.company?.companyName?.toLowerCase().includes(q) ||
      p.vendor?.businessName?.toLowerCase().includes(q)
    );
  });

  const statCards = stats
    ? [
        { label: "Gross Volume", value: stats.total || 0, icon: <CreditCard /> },
        { label: "Finalized", value: stats.completed || 0, icon: <TrendUp /> },
        { label: "In Pipeline", value: stats.pending || 0, icon: <Clock /> },
        { label: "Failed/Alert", value: stats.failed || 0, icon: <WarningCircle /> },
      ]
    : [];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Stats */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 shadow-soft border-border/50">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 z-10" />
                <Input
                    type="text"
                    placeholder="MagnifyingGlass by invoice, company, vendor..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9 bg-muted/20"
                />
            </div>
            <Select
                value={filters.status}
                onChange={(val) => { setFilters({ ...filters, status: val }); setPage(1); }}
                options={statusOptions}
                className="w-full sm:w-48 bg-muted/20"
            />
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-soft border-border/50 overflow-hidden">
        <Card.Header className="pb-4 border-b border-border/50 bg-muted/20">
            <Card.Title className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Transaction Log</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
            {isLoading ? (
                <div className="p-8 space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ) : filteredPayments.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments found" description="No transaction records match your current filter criteria." className="border-0 bg-transparent py-16 shadow-none" />
            ) : (
                <DataTable
                data={filteredPayments}
                sectionClassName="border-0 bg-transparent shadow-none"
                columns={[
                    {
                    key: "invoiceNumber",
                    label: "Invoice",
                    cellClassName: "px-6 py-4",
                    render: (p) => <span className="font-bold text-[11px] uppercase text-muted-foreground">{p.invoiceNumber || "-"}</span>,
                    },
                    {
                    key: "company",
                    label: "Origin (Company)",
                    cellClassName: "px-6 py-4",
                    render: (p) => <span className="text-sm font-bold text-foreground truncate block w-40">{p.company?.companyName || p.company?.username || "-"}</span>,
                    },
                    {
                    key: "vendor",
                    label: "Destination (Vendor)",
                    cellClassName: "px-6 py-4",
                    render: (p) => <span className="text-sm font-bold text-foreground truncate block w-40">{p.vendor?.businessName || p.vendor?.username || "-"}</span>,
                    },
                    {
                    key: "amount",
                    label: "Amount",
                    cellClassName: "px-6 py-4",
                    render: (p) => <span className="font-extrabold text-sm text-foreground uppercase tracking-tight">PKR {p.amount?.toLocaleString()}</span>,
                    },
                    {
                    key: "status",
                    label: "Status",
                    cellClassName: "px-6 py-4",
                    render: (p) => <StatusChip status={p.status} />,
                    },
                    {
                    key: "createdAt",
                    label: "Date",
                    cellClassName: "px-6 py-4",
                    render: (p) => <span className="text-muted-foreground font-bold text-[11px] uppercase">{dayjs(p.createdAt).format("MMM D, YYYY")}</span>,
                    },
                ]}
                showRowActions
                actionsHeaderLabel=""
                rowActions={(p) => ([
                    {
                    key: "view",
                    label: "Details",
                    title: "View Details",
                    icon: <Eye className="h-3.5 w-3.5" />,
                    onClick: () => navigate(`/admin/payments/${p._id}`),
                    className: "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-foreground/80 hover:bg-muted transition-all",
                    },
                    {
                    key: "invoice",
                    label: "PDF",
                    title: "Download Invoice",
                    icon: <Download className="h-3.5 w-3.5" />,
                    onClick: () => handleDownloadInvoice(p._id),
                    hidden: !p.invoiceNumber,
                    className: "inline-flex items-center gap-1 rounded-lg bg-muted/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-tight text-foreground hover:bg-muted/50 transition-all",
                    },
                ])}
                />
            )}
        </Card.Content>
      </Card>

      {/* Pagination */}
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

export default AdminPayments;



