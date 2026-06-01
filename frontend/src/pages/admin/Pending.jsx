import React, { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Buildings, Clock, Storefront, CaretUp, CaretDown } from "@phosphor-icons/react";
import toastUtil from "@/lib/toast";
import { adminService } from "@/services/api";
import { 
  PageTransition, 
  Skeleton, 
  StatCard, 
  DataTable, 
  EmptyState
} from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";
import UserDetailsModal from "@/components/admin/UserDetailsModal";
import PendingActionMenu from "@/components/admin/PendingActionMenu";
import { cn } from "@/lib/cn";

dayjs.extend(relativeTime);

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
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border mt-1",
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
              from last month
          </span>
      </div>
  );
};

import { usePageMeta } from "@/hooks/usePageMeta";

const Pending = () => {
  usePageMeta("Approvals", "Review pending account verifications");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [changes, setChanges] = useState({ pending: 0, companies: 0, vendors: 0 });
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, statsRes] = await Promise.all([
        adminService.getPendingVerifications(),
        adminService.getStats(),
      ]);
      setRecords(pendingRes.data || []);
      if (statsRes.data?.changes) {
        setChanges({
          pending: statsRes.data.changes.pending,
          companies: statsRes.data.changes.companies,
          vendors: statsRes.data.changes.vendors,
        });
      }
    } catch (error) {
      toastUtil.handleApiError(error, { default: "Could not load data" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        record.email?.toLowerCase().includes(query) ||
        record.fullName?.toLowerCase().includes(query) ||
        record.companyName?.toLowerCase().includes(query);

      if (activeTab === 0) return matchesSearch;
      if (activeTab === 1) return matchesSearch && record.role === "company";
      if (activeTab === 2) return matchesSearch && record.role === "vendor";
      return matchesSearch;
    });
  }, [records, search, activeTab]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      companies: records.filter((r) => r.role === "company").length,
      vendors: records.filter((r) => r.role === "vendor").length,
    };
  }, [records]);

  const onApprove = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await adminService.approveVerification(userId);
      toastUtil.success("Profile approved successfully");
      setViewModalOpen(false);
      await loadData();
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const onReject = async (userId, reason) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await adminService.rejectVerification(userId, { reason });
      toastUtil.success("Profile rejected and user notified via email");
      setViewModalOpen(false);
      await loadData();
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleDownloadPDF = async (user) => {
    const toastId = toastUtil.loading("Preparing document...");
    try {
      const [{ pdf }, { default: UserDetailsPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/admin/UserDetailsPDF"),
      ]);

      const fileName = `${user.companyName || user.fullName || user.email || "user"}_profile.pdf`;
      const blob = await pdf(<UserDetailsPDF user={user} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toastUtil.success("Profile exported successfully", { id: toastId });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toastUtil.error("Failed to generate PDF profile", { id: toastId });
    }
  };

  const userColumns = [
    {
      key: "user",
      label: "User",
      cellClassName: "px-6 py-4 whitespace-nowrap",
      render: (user) => {
        const displayName = user.companyName || user.fullName || user.email;
        return (
          <div className="flex items-center gap-2">
            <UserAvatar user={user} name={displayName} size="md" />
            <span className="font-semibold">{displayName}</span>
          </div>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-muted-foreground",
      render: (user) => user.email,
    },
    {
      key: "role",
      label: "Role",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-foreground/80 capitalize",
      render: (user) => user.role,
    },
    {
      key: "submitted",
      label: "Submitted",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-muted-foreground",
      render: (user) => (
        <>
          <div>{dayjs(user.updatedAt).format("MMM DD, YYYY")}</div>
          <div className="text-xs">{dayjs(user.updatedAt).fromNow()}</div>
        </>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "relative px-6 py-3",
      cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
      render: (user) => (
        <PendingActionMenu
          actionLoading={actionLoading[user._id]}
          onView={() => handleViewDetails(user)}
        />
      ),
    },
  ];

  const tabOptions = [
    { label: "All", count: records.length },
    { label: "Companies", count: records.filter(r => r.role === "company").length },
    { label: "Vendors", count: records.filter(r => r.role === "vendor").length }
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {loading ? (
          <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
              <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
              </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard 
              title="Pending Total" 
              value={stats.total} 
              icon={<Clock />} 
              loading={loading}
              trend={<ChangeIndicator value={changes.pending} />}
          />
          <StatCard 
              title="Companies" 
              value={stats.companies} 
              icon={<Buildings />} 
              loading={loading}
              trend={<ChangeIndicator value={changes.companies} />}
          />
          <StatCard 
              title="Vendors" 
              value={stats.vendors} 
              icon={<Storefront />} 
              loading={loading}
              trend={<ChangeIndicator value={changes.vendors} />}
          />
        </div>

        <FilterSearchBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search users by name or email..."
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabOptions.map(t => `${t.label} (${t.count})`)}
        />

        {loading ? (
          <Skeleton className="h-96 w-full rounded-xl bg-muted" />
        ) : (
          <DataTable
            columns={userColumns}
            data={filtered}
            rowKey="_id"
            emptyState={
              <EmptyState
                icon={Clock}
                title="No pending records"
                description="No onboarding submissions waiting for review."
                className="border-none bg-transparent py-6 shadow-none"
              />
            }
            emptyCellClassName="px-4 py-6"
          />
        )}

        <UserDetailsModal
          open={viewModalOpen}
          user={selectedUser}
          onX={() => setViewModalOpen(false)}
          onDownloadPDF={handleDownloadPDF}
          onApprove={onApprove}
          onReject={onReject}
          actionLoading={selectedUser ? actionLoading[selectedUser._id] : false}
        />
      </>
    )}
  </div>
</PageTransition>
  );
};

export default Pending;

