import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardText as Assignment,
  CheckCircle,
  Receipt,
  CurrencyDollar as AttachMoney,
  ChartPie as PieChartIcon,
  TrendUp,
  ChartBar as BarChartIcon,
  Briefcase,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "@/services/api";
import ApprovalStatusBanner from "@/components/ApprovalStatusBanner";
import StatusChip from "@/components/shared/StatusChip";
import {
  Button,
  EmptyState,
  PageTransition,
  Loader,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DataTable,
  StatCard,
  Card,
} from "@/components/ui";

dayjs.extend(relativeTime);

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    assignedProjects: 0,
    submittedProposals: 0,
    ongoingWork: 0,
    weeklyEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [proposalsRes, contractsRes] = await Promise.all([
        api.get("/proposals/vendor").catch(() => ({ data: [] })),
        api.get("/contracts/vendor").catch(() => ({ data: [] })),
      ]);

      const proposalsData = Array.isArray(proposalsRes.data) ? proposalsRes.data : proposalsRes.data?.data || [];
      const contractsData = Array.isArray(contractsRes.data) ? contractsRes.data : contractsRes.data?.data || [];

      setProposals(proposalsData);
      setContracts(contractsData);

      setStats({
        assignedProjects: contractsData.filter((c) => c.status === "active").length,
        submittedProposals: proposalsData.filter(
          (p) => p.status === "submitted" || p.status === "pending"
        ).length,
        ongoingWork: contractsData.filter((c) => c.status === "active").length,
        weeklyEarnings: contractsData
          .filter((c) => c.status === "active")
          .reduce((sum, c) => sum + (c.amount || 0), 0),
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const proposalStatusData = useMemo(() => {
    const submitted = proposals.filter((p) => p.status === "submitted" || p.status === "pending").length;
    const accepted = proposals.filter((p) => p.status === "accepted").length;
    const rejected = proposals.filter((p) => p.status === "rejected").length;

    return [
      { name: "Pending", value: submitted, color: "var(--muted-foreground)" },
      { name: "Accepted", value: accepted, color: "var(--color-primary)" },
      { name: "Rejected", value: rejected, color: "var(--color-muted-foreground)" },
    ].filter((item) => item.value > 0);
  }, [proposals]);

  const proposalsByCategoryData = useMemo(() => {
    const categoryCount = {};
    proposals.forEach((proposal) => {
      const category = proposal.task?.category || "Other";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " "),
        proposals: count,
      }))
      .sort((a, b) => b.proposals - a.proposals)
      .slice(0, 5);
  }, [proposals]);

  const earningsOverTimeData = useMemo(() => {
    const last6Months = [];
    const now = dayjs();

    for (let i = 5; i >= 0; i--) {
      const month = now.subtract(i, "month");
      const monthKey = month.format("YYYY-MM");
      const monthEarnings = contracts
        .filter((contract) => dayjs(contract.createdAt).format("YYYY-MM") === monthKey)
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      last6Months.push({
        month: month.format("MMM"),
        earnings: monthEarnings,
      });
    }
    return last6Months;
  }, [contracts]);

  const cumulativeEarningsData = useMemo(() => {
    let cumulative = 0;
    return earningsOverTimeData.map((item) => {
      cumulative += item.earnings;
      return {
        month: item.month,
        cumulative,
      };
    });
  }, [earningsOverTimeData]);

  const recentProposals = useMemo(() => {
    return [...proposals]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
      .slice(0, 5);
  }, [proposals]);

  const recentProposalColumns = [
    {
      key: "task",
      label: "Task",
      cellClassName: "px-6 py-4",
      render: (proposal) => (
        <>
          <p className="text-sm font-semibold text-[var(--foreground)]">{proposal.task?.title || "Untitled task"}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Proposal #{proposal._id?.slice(-6) || "N/A"}</p>
        </>
      ),
    },
    {
      key: "category",
      label: "Category",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]/80",
      render: (proposal) => proposal.task?.category || "General",
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "px-6 py-4",
      render: (proposal) => <StatusChip status={proposal.status || "submitted"} />,
    },
    {
      key: "bid",
      label: "Bid",
      cellClassName: "px-6 py-4 text-sm text-[var(--foreground)]",
      render: (proposal) => `$${(proposal.bidAmount || proposal.amount || 0).toLocaleString()}`,
    },
    {
      key: "submitted",
      label: "Submitted",
      cellClassName: "px-6 py-4",
      render: (proposal) => (
        <>
          <p className="text-sm text-[var(--foreground)]">{dayjs(proposal.createdAt).format("MMM DD, YYYY")}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{dayjs(proposal.createdAt).fromNow()}</p>
        </>
      ),
    },
  ];



  return (
    <PageTransition>
      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ApprovalStatusBanner />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/vendor/available-tasks")}
                className="w-full sm:w-auto"
              >
                Browse Tasks
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate("/vendor/my-proposals")}
                className="w-full sm:w-auto"
              >
                View Proposals
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Projects Assigned" value={stats.assignedProjects} icon={<Assignment />} link="/vendor/contracts" />
            <StatCard title="Proposals Submitted" value={stats.submittedProposals} icon={<CheckCircle />} link="/vendor/my-proposals" />
            <StatCard title="Ongoing Work" value={stats.ongoingWork} icon={<Receipt />} link="/vendor/contracts" />
            <StatCard title="Weekly Earnings" value={`$${stats.weeklyEarnings.toLocaleString()}`} icon={<AttachMoney />} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <AttachMoney className="h-5 w-5 text-[var(--foreground)]" />
                    <Card.Title>Monthly Earnings</Card.Title>
                  </div>
                  <Card.Description>Contract earnings over the last six months</Card.Description>
                </Card.Header>
                <Card.Content>
                  <ChartContainer className="aspect-auto h-[260px] w-full">
                    <LineChart data={earningsOverTimeData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${value.toLocaleString()}`} />} />
                      <Line type="monotone" dataKey="earnings" stroke="var(--color-primary)" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    </LineChart>
                  </ChartContainer>
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-[var(--foreground)]" />
                    <Card.Title>Proposal Outcomes</Card.Title>
                  </div>
                  <Card.Description>Current acceptance and rejection mix</Card.Description>
                </Card.Header>
                <Card.Content>
                  {proposalStatusData.length > 0 ? (
                    <>
                      <ChartContainer className="aspect-auto h-[230px] w-full">
                        <PieChart>
                          <Pie data={proposalStatusData} cx="50%" cy="50%" innerRadius={58} outerRadius={90} dataKey="value" strokeWidth={5} stroke="var(--color-card)">
                            {proposalStatusData.map((entry, index) => (
                              <Cell key={`proposal-status-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                        {proposalStatusData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[11px] font-bold uppercase tracking-tight text-[var(--muted-foreground)]">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon={PieChartIcon}
                      title="No proposal data yet"
                      description="Proposal outcomes will appear after vendors submit bids and receive decisions."
                      className="border-0 bg-transparent px-0 py-10 shadow-none"
                    />
                  )}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-[var(--foreground)]" />
                    <Card.Title>Proposals by Category</Card.Title>
                  </div>
                  <Card.Description>Pulse across task categories</Card.Description>
                </Card.Header>
                <Card.Content>
                  {proposalsByCategoryData.length > 0 ? (
                    <ChartContainer className="aspect-auto h-[250px] w-full">
                      <BarChart data={proposalsByCategoryData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="proposals" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <EmptyState
                      icon={BarChartIcon}
                      title="No proposals yet"
                      description="Category performance appears once proposal submissions are available."
                      className="border-0 bg-transparent px-0 py-10 shadow-none"
                    />
                  )}
                </Card.Content>
              </Card>
            </div>

            <div className="lg:col-span-6">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <TrendUp className="h-5 w-5 text-[var(--foreground)]" />
                    <Card.Title>Growth Overview</Card.Title>
                  </div>
                  <Card.Description>Cumulative earnings growth</Card.Description>
                </Card.Header>
                <Card.Content>
                  <ChartContainer className="aspect-auto h-[250px] w-full">
                    <AreaChart data={cumulativeEarningsData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                      <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${value.toLocaleString()}`} />} />
                      <Area type="monotone" dataKey="cumulative" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.05} strokeWidth={3} />
                    </AreaChart>
                  </ChartContainer>
                </Card.Content>
              </Card>
            </div>
          </div>

          <DataTable
            columns={recentProposalColumns}
            data={recentProposals}
            rowKey="_id"
            showSectionHeader
            icon={<Briefcase size={22} />}
            title="Recent Proposals"
            subtitle="Latest proposal submissions and outcomes"
            emptyState="No proposals found yet."
            emptyCellClassName="px-6 py-10 text-center text-sm text-[var(--muted-foreground)]"
          />
        </div>
      )}
    </PageTransition>
  );
};

export default VendorDashboard;
