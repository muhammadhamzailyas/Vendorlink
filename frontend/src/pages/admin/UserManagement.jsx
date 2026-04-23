import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users as People } from "@phosphor-icons/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toastUtil from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DataTable,
  EmptyState,
  PageTransition,
  Skeleton,
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
});

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    user: null,
  });
  const [archiveState, setArchiveState] = useState(createInitialArchiveState);

  const tabOptions = useMemo(
    () => [
      { value: "all", label: "All Users", count: users.length },
      {
        value: "company",
        label: "Companies",
        count: users.filter((user) => user.role === "company").length,
      },
      {
        value: "vendor",
        label: "Vendors",
        count: users.filter((user) => user.role === "vendor").length,
      },
      {
        value: "pending",
        label: "Pending",
        count: users.filter((user) => user.status === "pending").length,
      },
      {
        value: "approved",
        label: "Approved",
        count: users.filter((user) => user.status === "approved").length,
      },
      {
        value: "rejected",
        label: "Rejected",
        count: users.filter((user) => user.status === "rejected").length,
      },
    ],
    [users]
  );

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

  const handleDownloadPDF = async () => {
    if (!userDetails) return;

    try {
      const [{ pdf }, { default: UserDetailsPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/admin/UserDetailsPDF"),
      ]);

      const fileName = `${userDetails.companyName || userDetails.email || "user"}_details.pdf`;
      const blob = await pdf(<UserDetailsPDF user={userDetails} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toastUtil.success("PDF downloaded successfully", { autoX: 2000 });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toastUtil.error("Failed to generate PDF");
    }
  };

  const openConfirmDialog = (user) => {
    setConfirmState({ open: true, user });
  };

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, user: null });
  };

  const closeArchiveDialog = () => {
    setArchiveState(createInitialArchiveState());
  };

  const openArchiveDialog = async (user) => {
    setArchiveState({
      open: true,
      user,
      briefing: null,
      loading: true,
      submitting: false,
      reason: "",
      acknowledgeWarnings: false,
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

  const handleConfirmAction = async () => {
    const user = confirmState.user;
    if (!user) return;

    setActionLoading((prev) => ({ ...prev, [user._id]: true }));
    try {
      await adminService.rejectUser(user._id);
      await fetchUsers();
      toastUtil.success("User suspended successfully");
      closeConfirmDialog();
    } catch (error) {
      toastUtil.handleApiError(error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  const handleArchiveConfirm = async () => {
    const user = archiveState.user;
    if (!user) return;

    setArchiveState((current) => ({ ...current, submitting: true }));
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));

    try {
      const response = await adminService.softDeleteUser(user._id, {
        reason: archiveState.reason.trim(),
        acknowledgeWarnings: archiveState.acknowledgeWarnings,
      });

      setUsers((prev) => prev.filter((candidate) => candidate._id !== user._id));
      closeArchiveDialog();

      const cancelledContractsCount = Number(response.data?.cancelledContractsCount || 0);
      const notificationCount = Number(response.data?.notificationCount || 0);
      let successMessage = "User archived successfully.";

      if (cancelledContractsCount > 0 && notificationCount > 0) {
        successMessage = `User archived successfully. ${cancelledContractsCount} live contract(s) were cancelled and ${notificationCount} counterparty notification(s) were sent.`;
      } else if (cancelledContractsCount > 0) {
        successMessage = `User archived successfully. ${cancelledContractsCount} live contract(s) were cancelled.`;
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
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const currentFilter = tabOptions[activeTab]?.value || "all";
      const matchesTab =
        currentFilter === "all" ||
        user.role === currentFilter ||
        user.status === currentFilter;

      return matchesSearch && matchesTab;
    });
  }, [users, searchTerm, tabOptions, activeTab]);

  const isDialogActionLoading = Boolean(
    confirmState.user?._id && actionLoading[confirmState.user._id]
  );

  const userColumns = [
    {
      key: "user",
      label: "User",
      cellClassName: "px-6 py-4 whitespace-nowrap",
      render: (user) => {
        const displayName = user.companyName || user.username || user.email || "User";
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
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]",
      render: (user) => user.email,
    },
    {
      key: "role",
      label: "Role",
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground)]/80 capitalize",
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
      cellClassName: "px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]",
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
      render: (user) => (
        <UserActionMenu
          user={user}
          actionLoading={actionLoading[user._id]}
          onView={() => handleView(user)}
          onSuspend={() => openConfirmDialog(user)}
          onArchive={() => openArchiveDialog(user)}
        />
      ),
    },
  ];

  const dialogUserLabel =
    confirmState.user?.companyName || confirmState.user?.email || "this user";

  return (
    <PageTransition>
      <div className="space-y-8">
        <FilterSearchBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="MagnifyingGlass by company, username, or email..."
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabOptions.map((tab) => `${tab.label} (${tab.count})`)}
        />

        {loading ? (
          <Skeleton className="h-96 w-full rounded-2xl bg-[var(--muted)]" />
        ) : (
          <DataTable
            columns={userColumns}
            data={filtered}
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

        <AlertDialog open={confirmState.open} onOpenChange={closeConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend User</AlertDialogTitle>
              <AlertDialogDescription>
                This user will be moved to rejected status and lose normal access. Target:{" "}
                <span className="font-bold">{dialogUserLabel}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={closeConfirmDialog}
                disabled={isDialogActionLoading}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                disabled={isDialogActionLoading}
              >
                {isDialogActionLoading ? "Processing..." : "Suspend"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default UserManagement;
