import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowsLeftRight,
  ChartBar,
  CaretLeft,
  CaretRight,
  CheckCircle,
  ClipboardText as Assignment,
  Clock as PendingIcon,
  FilePlus as AddTask,
  FileText as Description,
  Pulse as MonitorHeart,
  Layout as Dashboard,
  ListChecks as Task,
  SignOut as SignOutIcon,
  ChatCircleText,
  ChatText as Feedback,
  Receipt,
  Gear as Settings,
  Users as People,
  Wallet,
} from "@phosphor-icons/react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ApprovalStatusBanner from "../ApprovalStatusBanner";
import { Skeleton } from "../ui";
import { cn } from "@/lib/cn";
import { useUser } from "../../context/UserContext";

// Re-using Assessment icon for Reports
const Assessment = ChartBar;

const MENU_CONFIG = {
  admin: {
    main: [
      { text: "Dashboard", icon: Dashboard, path: "/admin" },
      { text: "User Management", icon: People, path: "/admin/users" },
      { text: "Approvals", icon: PendingIcon, path: "/admin/pending" },
      { text: "Task Monitoring", icon: MonitorHeart, path: "/admin/task-monitoring" },
      { text: "Contract", icon: Description, path: "/admin/contract" },
      { text: "Reports", icon: Assessment, path: "/admin/reports" },
      { text: "Payments", icon: Wallet, path: "/admin/payments" },
      { text: "Transactions", icon: ArrowsLeftRight, path: "/admin/transactions" },
      { text: "Feedback", icon: Feedback, path: "/admin/feedback" },
    ],
  },
  company: {
    main: [
      { text: "Dashboard", icon: Dashboard, path: "/company" },
      { text: "Post a Task", icon: AddTask, path: "/company/add-task" },
      { text: "My Task Page", icon: Task, path: "/company/my-tasks" },
      { text: "Contracts", icon: Description, path: "/company/contracts" },
      { text: "Progress", icon: ChartBar, path: "/company/progress" },
      { text: "Wallet", icon: Wallet, path: "/company/payments" },
      { text: "Messages", icon: ChatCircleText, path: "/company/messages" },
      { text: "Feedback", icon: Feedback, path: "/company/feedback" },
    ],
  },
  vendor: {
    main: [
      { text: "Dashboard", icon: Dashboard, path: "/vendor" },
      { text: "Available Task", icon: Assignment, path: "/vendor/available-tasks" },
      { text: "My Proposals", icon: CheckCircle, path: "/vendor/my-proposals" },
      { text: "Contracts", icon: Receipt, path: "/vendor/contracts" },
      { text: "Progress", icon: ChartBar, path: "/vendor/progress" },
      { text: "Wallet", icon: Wallet, path: "/vendor/payments" },
      { text: "Messages", icon: ChatCircleText, path: "/vendor/messages" },
      { text: "Feedback", icon: Feedback, path: "/vendor/feedback" },
    ],
  },
};

const PAGE_TITLES = {
  "/company/contract/create": "Create Contract",
  "/company/proposals": "Proposal Registry",
  "/company/task": "Task Detail",
  "/company/task-progress": "Progress",
  "/vendor/task-progress": "Progress",
};

const PAGE_SUBTITLES = {
  "/admin": "Overview of platform activity and growth",
  "/admin/users": "Manage and monitor all platform users",
  "/admin/pending": "Review pending account verifications",
  "/admin/task-monitoring": "Monitor and track all platform tasks",
  "/admin/contract": "Monitor active and completed task agreements across the platform",
  "/admin/reports": "Platform performance snapshot for users and tasks",
  "/admin/notifications": "Chronological audit of platform events and administrative alerts",
  "/admin/payments": "Monitor task-related payments and platform fee distributions",
  "/admin/transactions": "Complete chronological record of all platform monetary movements",
  "/admin/settings": "Manage access preferences and account-level notifications",
  "/company": "Monitor tasks, proposals, and budgets in one place",
  "/company/add-task": "Create and publish a new task",
  "/company/vendor-marketplace": "Review vendors who have submitted proposals to your tasks",
  "/company/my-tasks": "Manage and track all active and completed tasks",
  "/company/contracts": "Track accepted proposals and ongoing contracts with vendors",
  "/company/progress": "Monitor real-time execution and delivery milestones",
  "/company/task-progress": "Monitor real-time execution and delivery milestones",
  "/company/payments": "Manage your primary capital and project funding source",
  "/company/contract/create": "Define scope, milestones, and payment terms before issuing.",
  "/company/proposals": "Review vendor submissions and decide next actions",
  "/company/feedback": "Share your experience and suggestions",
  "/vendor": "Track proposal performance and earnings momentum",
  "/vendor/available-tasks": "Browse and apply for tasks that match your skills",
  "/vendor/my-proposals": "Track your submitted proposals and outcomes",
  "/vendor/contracts": "Track accepted proposals and active work commitments",
  "/vendor/progress": "Submit delivery updates and track project milestones",
  "/vendor/task-progress": "Submit delivery updates and track project milestones",
  "/vendor/payments": "Monitor your earnings and manage wallet withdrawals",
  "/vendor/feedback": "Share your experience and suggestions",
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();

  const role = user?.role;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !role) return;
    const currentPath = location.pathname;
    
    // Simple role-based protection
    if (currentPath.startsWith("/admin") && role !== "admin") navigate("/" + role);
    else if (currentPath.startsWith("/company") && role !== "company") navigate("/" + role);
    else if (currentPath.startsWith("/vendor") && role !== "vendor") navigate("/" + role);
  }, [location.pathname, user, role, navigate]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleSignOut = () => {
    logout();
  };

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  const { main = [] } = MENU_CONFIG[role] || {};

  const pageTitle = useMemo(() => {
    // 1. Check for exact menu matches
    const exactMatch = main.find((item) => item.path === location.pathname);
    if (exactMatch) return exactMatch.text;

    // 2. Special case for progress detail routes (must come before general task matching)
    if (location.pathname.includes("/progress") || location.pathname.endsWith("/progress")) {
      return "Progress";
    }

    // 3. Check for explicit overrides (exact or prefix)
    const exactTitleMatch = PAGE_TITLES[location.pathname];
    if (exactTitleMatch) return exactTitleMatch;

    const prefixTitleMatch = Object.keys(PAGE_TITLES).find(path => 
        location.pathname.startsWith(path) && path !== `/${role}`
    );
    if (prefixTitleMatch) return PAGE_TITLES[prefixTitleMatch];

    // 4. Check for menu path prefixes
    const menuPrefixMatch = main.find(
      (item) => item.path !== `/${role}` && location.pathname.startsWith(`${item.path}`)
    );
    if (menuPrefixMatch) return menuPrefixMatch.text;

    // 5. Fallback to formatting the last URL segment
    const lastSegment = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
    return lastSegment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [location.pathname, main, role]);

  const pageSubtitle = useMemo(() => {
    const settingsPath = `/${role}/settings`;
    if (location.pathname === settingsPath) return "Manage your account preferences";
    
    // Special case for progress detail routes
    if (location.pathname.includes("/progress") || location.pathname.endsWith("/progress")) {
      return role === "company" 
        ? "Monitor real-time execution and delivery milestones"
        : "Submit delivery updates and track project milestones";
    }

    // Check exact match
    if (PAGE_SUBTITLES[location.pathname]) return PAGE_SUBTITLES[location.pathname];

    // Check prefix match
    const prefixSubtitleMatch = Object.keys(PAGE_SUBTITLES).find(path => 
        location.pathname.startsWith(path) && path !== `/${role}`
    );
    if (prefixSubtitleMatch) return PAGE_SUBTITLES[prefixSubtitleMatch];

    return "";
  }, [location.pathname, role]);

  if (!user || !role) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <Skeleton className="h-10 w-64 mb-4 bg-muted" />
          <Skeleton className="h-4 w-48 mx-auto bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden p-4">
      <Sidebar
        menuItems={main}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={toggleDesktopSidebar}
        role={role}
        user={user}
        onLogout={handleSignOut}
      />

      <motion.main 
        initial={false}
        animate={{ 
          marginLeft: isSidebarCollapsed ? 96 : 272
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "flex-1 flex flex-col min-w-0 border border-border bg-card rounded-2xl overflow-hidden shadow-sm"
        )}
      >
        <Header 
          user={user} 
          menuItems={main}
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onLogout={handleSignOut}
        />

        <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
          <div className={cn(
            "mx-auto px-4 py-8 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out",
            isSidebarCollapsed ? "max-w-[1600px]" : "max-w-7xl"
          )}>
            <ApprovalStatusBanner />
            <Outlet />
          </div>
        </div>
      </motion.main>

      
    </div>
  );
};

export default DashboardLayout;
