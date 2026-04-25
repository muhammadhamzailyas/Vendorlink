import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  TrendUp,
  Clock,
  WarningCircle,
  CurrencyDollar,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import { paymentAPI } from "@/services/paymentAPI";
import { adminService } from "@/services/api";
import toastUtil from "@/lib/toast";
import { 
  PageTransition, 
  Skeleton, 
  EmptyState, 
  DataTable, 
  StatCard, 
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
import PaymentActionMenu from "@/components/admin/PaymentActionMenu";
import dayjs from "dayjs";
import { cn } from "@/lib/cn";

const ChangeIndicator = ({ value }) => {
  const val = parseFloat(value || 0);
  const isPositive = val > 0;
  const isNegative = val < 0;
  
  const colorClass = isPositive 
      ? "bg-success/20 text-success border-success/30" 
      : isNegative 
          ? "bg-error/20 text-error border-error/30" 
          : "bg-muted text-muted-foreground border-border";

  return (
      <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border mt-1",
          colorClass
      )}>
          <div className="flex items-center gap-0.5">
              {isPositive && <CaretUp size={10} weight="bold" />}
              {isNegative && <CaretDown size={10} weight="bold" />}
              <span className="text-[10px] font-black uppercase tracking-tight">
                  {Math.abs(val)}%
              </span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tight opacity-90 ml-1">
              vs last month
          </span>
      </div>
  );
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.payments)) return value.payments;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const AdminPayments = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data: statsData } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.getStats(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", page, activeTab],
    queryFn: async () => {
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
        totalCount: d?.pagination?.total || 0
      };
    },
    onError: () => toastUtil.error("Failed to load payments"),
  });

  const payments = data?.payments || [];
  const totalPages = data?.totalPages || 1;
  const counts = data?.counts || {};
  const changes = statsData?.data?.changes || {};

  const handleDownloadInvoice = async (paymentId) => {
    const toastId = (typeof toastUtil.loading === "function") 
      ? toastUtil.loading("Preparing invoice...")
      : toastUtil.info("Preparing invoice...");
    try {
      await paymentAPI.downloadInvoice(paymentId);
      toastUtil.success("Invoice downloaded", { id: toastId });
    } catch {
      toastUtil.error("Failed to download invoice", { id: toastId });
    }
  };

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (!q) return true;
      return (
        p.invoiceNumber?.toLowerCase().includes(q) ||
        p.companyId?.companyName?.toLowerCase().includes(q) ||
        p.companyId?.username?.toLowerCase().includes(q) ||
        p.vendorId?.username?.toLowerCase().includes(q)
      );
    });
  }, [payments, search]);

  const paymentColumns = [
    {
      key: "invoice",
      label: "Invoice",
      cellClassName: "px-6 py-4",
      render: (p) => <span className="font-bold text-[10px] uppercase text-muted-foreground tracking-widest">{p.invoiceNumber || p._id.slice(-8)}</span>,
    },
    {
      key: "company",
      label: "Company",
      cellClassName: "px-6 py-4",
      render: (p) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={p.companyId} name={p.companyId?.companyName || p.companyId?.username} size="sm" />
          <span className="text-sm font-bold text-foreground">{p.companyId?.companyName || p.companyId?.username || "—"}</span>
        </div>
      ),
    },
    {
      key: "vendor",
      label: "Vendor",
      cellClassName: "px-6 py-4",
      render: (p) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={p.vendorId} name={p.vendorId?.username} size="sm" />
          <span className="text-sm font-medium text-foreground/80">{p.vendorId?.username || "—"}</span>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      cellClassName: "px-6 py-4 text-sm font-black text-foreground",
      render: (p) => `$${(p.amount || 0).toLocaleString()}`,
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
        headerClassName: "relative px-6 py-3",
        cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
        render: (p) => (
          <PaymentActionMenu
            onView={() => navigate(`/admin/payments/${p._id}`)}
            onDownload={() => handleDownloadInvoice(p._id)}
            hasInvoice={!!p.invoiceNumber}
          />
        ),
    },
  ];

  const tabOptions = [
    { label: "All Payments", value: "all", count: counts.all || 0 },
    { label: "Pending", value: "pending", count: counts.pending || 0 },
    { label: "Processing", value: "processing", count: counts.processing || 0 },
    { label: "Completed", value: "completed", count: counts.completed || 0 },
    { label: "Failed", value: "failed", count: counts.failed || 0 },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Volume"
          value={`$${statsData?.data?.growthData?.reduce((sum, d) => sum + (d.totalVolume || 0), 0).toLocaleString() || 0}`}
          icon={<CurrencyDollar className="text-success" />}
          trend={<ChangeIndicator value={changes.revenue} />}
        />
        <StatCard
          title="Platform Revenue"
          value={`$${statsData?.data?.growthData?.[5]?.revenue?.toLocaleString() || 0}`}
          icon={<TrendUp className="text-success" />}
          trend={<ChangeIndicator value={changes.revenue} />}
        />
        <StatCard
          title="Active Settlements"
          value={counts.processing || 0}
          icon={<Clock />}
        />
        <StatCard
          title="Failed/Refunded"
          value={(counts.failed || 0) + (counts.refunded || 0)}
          icon={<WarningCircle className="text-danger" />}
        />
      </div>

      <FilterSearchBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="search by invoice or name"
        activeTab={activeTab}
        onTabChange={(idx) => { setActiveTab(idx); setPage(1); }}
        tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl bg-muted" />
      ) : (
        <DataTable
          columns={paymentColumns}
          data={filteredPayments}
          rowKey="_id"
          emptyState={
            <EmptyState
              icon={CreditCard}
              title="No transactions found"
              description={search ? "Try adjusting your search criteria" : "All platform financial activity will appear here."}
              className="border-0 bg-transparent py-16 shadow-none"
            />
          }
        />
      )}

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
