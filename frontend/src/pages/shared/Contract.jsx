import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FileText as Description, CheckCircle as CheckCircle, ClipboardText as Assignment } from "@phosphor-icons/react";
import dayjs from "dayjs";
import api from "@/services/api";
import { useUser } from "@/context/UserContext";
import { EmptyState, PageTransition, Loader, StatCard, DataTable } from "@/components/ui";
import FilterSearchBar from "@/components/shared/FilterSearchBar";
import StatusChip from "@/components/shared/StatusChip";
import UserAvatar from "@/components/shared/UserAvatar";

const Contract = () => {
  const { user } = useUser();
  const role = user?.role;

  const [rows, setRows] = useState([]);
  const [search, setMagnifyingGlass] = useState("");
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!role) return;

    setLoading(true);
    try {
      if (role === "admin") {
        const tasksRes = await api.get("/tasks/all");
        const taskRows = (tasksRes.data || [])
          .filter((t) => t.status === "in-progress" || t.status === "completed")
          .map((t) => ({
            id: t._id,
            title: t.title || "Untitled Task",
            partner: t.companyId?.companyName || t.companyId?.email || "Company",
            partnerUser: t.companyId || null,
            amount: t.budget || 0,
            status: t.status,
            date: t.updatedAt || t.createdAt,
          }));
        setRows(taskRows);
      } else {
        const proposalsRes = await api.get("/proposals/company");
        const contractRows = (proposalsRes.data || [])
          .filter((p) => p.status === "accepted")
          .map((p) => ({
            id: p._id,
            title: p.taskId?.title || "Untitled Task",
            partner: p.vendorId?.username || p.vendorId?.email || "Vendor",
            partnerUser: p.vendorId || null,
            amount: p.bidAmount || 0,
            status: p.taskId?.status || "in-progress",
            date: p.acceptedAt || p.submittedAt,
          }));
        setRows(contractRows);
      }
    } catch (error) {
      console.error("Contract page load error:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.status !== "completed").length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const totalValue = rows.reduce((sum, r) => sum + r.amount, 0);
    return {
      total: rows.length,
      active,
      completed,
      totalValue,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        row.title?.toLowerCase().includes(search.toLowerCase()) ||
        row.partner?.toLowerCase().includes(search.toLowerCase());

      if (tab === 0) return matchesSearch;
      if (tab === 1) return matchesSearch && row.status !== "completed";
      return matchesSearch && row.status === "completed";
    });
  }, [rows, search, tab]);

  const contractColumns = [
    {
      key: "title",
      label: "Title",
      cellClassName: "px-6 py-4 text-sm text-foreground",
      render: (row) => row.title,
    },
    {
      key: "partner",
      label: role === "admin" ? "Company" : "Vendor",
      cellClassName: "px-6 py-4",
      render: (row) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={row.partnerUser || {}} name={row.partner} size="md" />
          <span className="text-sm text-foreground/80">{row.partner}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "value",
      label: "Value",
      cellClassName: "px-6 py-4 text-sm text-foreground/80",
      render: (row) => `$${row.amount.toLocaleString()}`,
    },
    {
      key: "updated",
      label: "Updated",
      cellClassName: "px-6 py-4 text-sm text-foreground/80",
      render: (row) => (row.date ? dayjs(row.date).format("MMM DD, YYYY") : "N/A"),
    },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value={stats.total}
          loading={loading}
          icon={<Description />}
        />
        <StatCard
          title="Active"
          value={stats.active}
          loading={loading}
          icon={<Assignment />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          loading={loading}
          icon={<CheckCircle />}
        />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          loading={loading}
          icon={<Description />}
        />
      </div>

      <FilterSearchBar
        searchValue={search}
        onSearchChange={setMagnifyingGlass}
        searchPlaceholder={`MagnifyingGlass by ${role === "admin" ? "task or company" : "task or vendor"}...`}
        activeTab={tab}
        onTabChange={setTab}
        tabs={["All", "Active", "Completed"]}
      />

      {loading ? (
        <Loader />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          icon={Description}
          title="No contract records found"
          description="Accepted proposals and active task agreements will appear here."
        />
      ) : (
        <DataTable
          columns={contractColumns}
          data={filteredRows}
          rowKey="id"
          tableClassName="w-full min-w-[860px]"
        />
      )}
    </div>
    </PageTransition>
  );
};

export default Contract;



