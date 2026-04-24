import React, { useEffect, useMemo, useState } from "react";
import {
  Users as People,
  Clock as PendingIcon,
  ListChecks as Task,
  CheckCircle as CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import dayjs from "dayjs";
import { StatCard, DataTable, Button, EmptyState, PageTransition, Skeleton, Card, Alert, AlertDescription, Loader } from "@/components/ui";
import StatusChip from "@/components/shared/StatusChip";
import api from "@/services/api";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, pendingRes, tasksRes] = await Promise.all([
        api.get("/admin/getallusers"),
        api.get("/admin/pendingusers"),
        api.get("/tasks/all"),
      ]);
      setUsers(usersRes.data || []);
      setPendingUsers(pendingRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error("Reports data load error:", err);
      setError("Unable to load report data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  const userStats = useMemo(() => {
    const approved = users.filter((u) => u.status === "approved").length;
    const rejected = users.filter((u) => u.status === "rejected").length;
    const pending = users.filter((u) => u.status === "pending").length;
    return {
      total: users.length,
      approved,
      rejected,
      pending,
    };
  }, [users]);

  const taskStats = useMemo(() => {
    const open = tasks.filter((t) => t.status === "open").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return {
      total: tasks.length,
      open,
      inProgress,
      completed,
    };
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks].slice(0, 8);
  }, [tasks]);

  const reportStatCards = [
    {
      title: "Total Users",
      value: userStats.total,
      icon: <People />,
    },
    {
      title: "Pending Approvals",
      value: pendingUsers.length || userStats.pending,
      icon: <PendingIcon />,
    },
    {
      title: "Total Tasks",
      value: taskStats.total,
      icon: <Task />,
    },
    {
      title: "Completed Tasks",
      value: taskStats.completed,
      icon: <CheckCircle />,
    },
  ];

  const recentTaskColumns = [
    {
      key: "title",
      label: "Recent Task",
      cellClassName: "px-6 py-4 text-sm text-foreground",
      render: (task) => task.title || "Untitled Task",
    },
    {
      key: "company",
      label: "Company",
      cellClassName: "px-6 py-4 text-sm text-muted-foreground",
      render: (task) => task.companyId?.companyName || task.companyId?.email || "N/A",
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (task) => <StatusChip status={task.status || "open"} />,
    },
    {
      key: "deadline",
      label: "Deadline",
      cellClassName: "px-6 py-4 text-sm text-muted-foreground",
      render: (task) => (task.deadline ? dayjs(task.deadline).format("MMM DD, YYYY") : "N/A"),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <WarningCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reportStatCards.map((stat) => (
            <StatCard key={stat.title} {...stat} loading={loading} />
          ))}
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <People className="h-5 w-5 text-foreground" />
                    <Card.Title>User Overview</Card.Title>
                  </div>
                  <Card.Description>Current approval state across platform users</Card.Description>
                </Card.Header>
                <Card.Content className="space-y-2">
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Approved:</span> 
                    <span className="font-bold text-foreground">{userStats.approved}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Pending:</span> 
                    <span className="font-bold text-foreground">{userStats.pending}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Rejected:</span> 
                    <span className="font-bold text-foreground">{userStats.rejected}</span>
                  </p>
                </Card.Content>
              </Card>

              <Card>
                <Card.Header>
                  <div className="flex items-center gap-3">
                    <Task className="h-5 w-5 text-foreground" />
                    <Card.Title>Task Overview</Card.Title>
                  </div>
                  <Card.Description>Current task distribution by workflow status</Card.Description>
                </Card.Header>
                <Card.Content className="space-y-2">
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Open:</span> 
                    <span className="font-bold text-foreground">{taskStats.open}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>In Progress:</span> 
                    <span className="font-bold text-foreground">{taskStats.inProgress}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>Completed:</span> 
                    <span className="font-bold text-foreground">{taskStats.completed}</span>
                  </p>
                </Card.Content>
              </Card>
            </div>

            <DataTable
              columns={recentTaskColumns}
              data={recentTasks}
              rowKey="_id"
              showSectionHeader
              icon={<Task className="h-5 w-5" />}
              title="Recent Tasks"
              subtitle="Latest tasks available for operational review"
              emptyState={<EmptyState icon={Task} title="No tasks available for reporting yet." className="border-0 bg-transparent py-2 shadow-none" />}
            />
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default Reports;



