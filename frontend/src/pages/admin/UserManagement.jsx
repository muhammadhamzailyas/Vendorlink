import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users as People } from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toastUtil from "@/lib/toast";
import {
  Button,
  DataTable,
  EmptyState,
  PageTransition,
  Skeleton,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui";
import { adminService } from "@/services/api";
import UserActionMenu from "@/components/admin/UserActionMenu";
import UserArchiveDialog from "@/components/admin/UserArchiveDialog";
import UserDetailsModal from "@/components/admin/UserDetailsModal";
import UserAvatar from "@/components/shared/UserAvatar";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";

dayjs.extend(relativeTime);

const createInitialArchiveState = () => ({
  open: false,
  user: null,
  briefing: null,
  loading: false,
  submitting: false,
  reason: "",
  acknowledgeWarnings: false,
  mode: "delete", // 'delete' or 'deactivate'
});

import { usePageMeta } from "@/hooks/usePageMeta";

const UserManagement = () => {
  usePageMeta("User Management", "Manage and monitor all platform users");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [archiveState, setArchiveState] = useState(createInitialArchiveState);

  const tabOptions = useMemo(() => {
    const validUsers = users.filter((user) => user.role !== "unassigned");
    return [
      { value: "all", label: "All Users", count: validUsers.length },
      {
        value: "company",
        label: "Companies",
        count: validUsers.filter((user) => user.role === "company").length,
      },
      {
        value: "vendor",
        label: "Vendors",
        count: validUsers.filter((user) => user.role === "vendor").length,
      },
      {
        value: "pending",
        label: "Pending",
        count: validUsers.filter((user) => user.status === "pending").length,
      },
      {
        value: "approved",
        label: "Approved",
        count: validUsers.filter((user) => user.status === "approved").length,
      },
      {
        value: "deactivated",
        label: "Deactivated",
        count: validUsers.filter((user) => user.status === "deactivated").length,
      },
      {
        value: "rejected",
        label: "Rejected",
        count: validUsers.filter((user) => user.status === "rejected").length,
      },
    ];
  }, [users]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleView = (user) => {
    setUserDetails(user);
    setViewModalOpen(true);
  };

  const handleXModal = () => {
    setViewModalOpen(false);
    setUserDetails(null);
  };

  const handleDownloadPDF = async (targetUser) => {
    const userToExport = targetUser || userDetails;
    if (!userToExport) {
      toastUtil.error("No user selected for export");
      return;
    }

    const toastId = (typeof toastUtil.loading === "function") 
      ? toastUtil.loading("Preparing document...")
      : toastUtil.info("Preparing document...");

    try {
      const [{ pdf }, { default: UserDetailsPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/admin/UserDetailsPDF"),
      ]);

      const fileName = `${userToExport.companyName || userToExport.fullName || userToExport.email || "user"}_profile.pdf`;
      const blob = await pdf(<UserDetailsPDF user={userToExport} />).toBlob();

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

  const closeArchiveDialog = () => {
    setArchiveState(createInitialArchiveState());
  };

  const openArchiveDialog = async (user, mode = "delete") => {
    setArchiveState({
      open: true,
      user,
      briefing: null,
      loading: true,
      submitting: false,
      reason: "",
      acknowledgeWarnings: false,
      mode,
    });
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));

    try {
      const response = await adminService.checkDeletion(user._id);
      setArchiveState((current) => {
        if (!current.open || current.user?._id !== user._id) {
          return current;
        }

        return {
          ...current,
          briefing: response.data,
          loading: false,
        };
      });
    } catch (error) {
      setArchiveState((current) =>
        current.user?._id === user._id ? createInitialArchiveState() : current
      );
      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  const handleArchiveConfirm = async () => {
    const user = archiveState.user;
    const mode = archiveState.mode;
    if (!user) return;

    setArchiveState((current) => ({ ...current, submitting: true }));
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));

    try {
      let response;
      if (mode === "deactivate") {
        response = await adminService.deactivateUser(user._id, {
          reason: archiveState.reason.trim(),
          acknowledgeWarnings: archiveState.acknowledgeWarnings,
        });
      } else {
        response = await adminService.softDeleteUser(user._id, {
          reason: archiveState.reason.trim(),
          acknowledgeWarnings: archiveState.acknowledgeWarnings,
        });
      }

      if (mode === "delete") {
        setUsers((prev) => prev.filter((candidate) => candidate._id !== user._id));
      } else {
        await fetchUsers();
      }

      closeArchiveDialog();

      const cancelledContractsCount = Number(response.data?.cancelledContractsCount || 0);
      const notificationCount = Number(response.data?.notificationCount || 0);
      const successMessageBase = mode === "deactivate" ? "User deactivated successfully." : "User deleted successfully.";
      let successMessage = successMessageBase;

      if (cancelledContractsCount > 0 && notificationCount > 0) {
        successMessage = `${successMessageBase} ${cancelledContractsCount} live contract(s) were cancelled and ${notificationCount} counterparty notification(s) were sent.`;
      } else if (cancelledContractsCount > 0) {
        successMessage = `${successMessageBase} ${cancelledContractsCount} live contract(s) were cancelled.`;
      }

      toastUtil.success(successMessage);
    } catch (error) {
      const nextBriefing = error.response?.data?.briefing;

      setArchiveState((current) => {
        if (current.user?._id !== user._id) {
          return current;
        }

        return {
          ...current,
          briefing: nextBriefing || current.briefing,
          loading: false,
          submitting: false,
        };
      });

      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [user._id]: false }));
      setArchiveState((current) =>
        current.user?._id === user._id ? { ...current, submitting: false } : current
      );
    }
  };

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        user.companyName?.toLowerCase().includes(query) ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const currentFilter = tabOptions[activeTab]?.value || "all";
      const matchesTab =
        currentFilter === "all" ||
        user.role === currentFilter ||
        user.status === currentFilter;

      return matchesSearch && matchesTab && user.role !== 'unassigned';
    });
  }, [users, searchTerm, tabOptions, activeTab]);

  const userColumns = [
    {
      key: "user",
      label: "User",
      cellClassName: "px-6 py-4 whitespace-nowrap",
      render: (user) => {
        const displayName = user.role === 'admin' ? "Admin" : (user.companyName || user.fullName || user.email || "User");
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
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4 whitespace-nowrap",
      render: (user) => <StatusChip status={user.status} />,
    },
    {
      key: "registered",
      label: "Registered",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-muted-foreground",
      render: (user) => (
        <>
          <div>{dayjs(user.createdAt).format("MMM DD, YYYY")}</div>
          <div className="text-xs">{dayjs(user.createdAt).fromNow()}</div>
        </>
      ),
    },
    {
      key: "actions",
      label: "",
      headerClassName: "relative px-6 py-3",
      cellClassName: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
      render: (user) => user.role !== 'admin' && (
        <UserActionMenu
          user={user}
          actionLoading={actionLoading[user._id]}
          onView={() => handleView(user)}
          onSuspend={() => openArchiveDialog(user, "deactivate")}
          onArchive={() => openArchiveDialog(user, "delete")}
        />
      ),
    },
  ];

  const paginatedUsers = useMemo(() => {
    return filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <PageTransition>
      <div className="space-y-8">
        <FilterSearchBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search users by name, email, or role..."
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabOptions.map((tab) => `${tab.label} (${tab.count})`)}
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <DataTable
              columns={userColumns}
              data={paginatedUsers}
              rowKey="_id"
              emptyState={
                <EmptyState
                  icon={People}
                  title="No users found"
                  description={
                    searchTerm
                      ? "Try adjusting your search criteria."
                      : "No users match the selected filter."
                  }
                  className="border-none bg-transparent py-6 shadow-none"
                />
              }
              emptyCellClassName="px-4 py-6"
            />

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (totalPages > 7) {
                        if (page !== 1 && page !== totalPages && (page < currentPage - 1 || page > currentPage + 1)) {
                            if (page === currentPage - 2 || page === currentPage + 2) {
                                return (
                                    <PaginationItem key={page}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }
                            return null;
                        }
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        <UserDetailsModal
          open={viewModalOpen}
          user={userDetails}
          onX={handleXModal}
          onDownloadPDF={handleDownloadPDF}
        />

        <UserArchiveDialog
          open={archiveState.open}
          onX={closeArchiveDialog}
          user={archiveState.user}
          briefing={archiveState.briefing}
          loading={archiveState.loading}
          submitting={archiveState.submitting}
          reason={archiveState.reason}
          acknowledgeWarnings={archiveState.acknowledgeWarnings}
          mode={archiveState.mode}
          onReasonChange={(value) =>
            setArchiveState((current) => ({ ...current, reason: value }))
          }
          onAcknowledgeWarningsChange={(value) =>
            setArchiveState((current) => ({
              ...current,
              acknowledgeWarnings: value,
            }))
          }
          onConfirm={handleArchiveConfirm}
        />
      </div>
    </PageTransition>
  );
};

export default UserManagement;




