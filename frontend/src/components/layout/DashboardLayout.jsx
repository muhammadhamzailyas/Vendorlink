import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowsLeftRight,
  ChartBar,
  Bell,
  ChartBar as Assessment,
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
  List as List,
  ChatCircleText as ChatCircleText,
  ChatText as Feedback,
  Receipt,
  Gear as Settings,
  Storefront,
  User,
  Users as People,
  Wallet,
} from "@phosphor-icons/react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import FloatingChatButton from "../FloatingChatButton";
import { Skeleton } from "../ui";
import { cn } from "@/lib/cn";
import { useUser } from "../../context/UserContext";
import { signOutFirebase } from "../../lib/firebase";

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
      { text: "Messages", icon: ChatCircleText, path: "/admin/messages" },
      { text: "Notifications", icon: Bell, path: "/admin/notifications" },
    ],
  },
  company: {
    main: [
      { text: "Dashboard", icon: Dashboard, path: "/company" },
      { text: "Post a Task", icon: AddTask, path: "/company/add-task" },
      { text: "Vendor Marketplace", icon: Storefront, path: "/company/vendor-marketplace" },
      { text: "My Task Page", icon: Task, path: "/company/my-tasks" },
      { text: "Contracts", icon: Description, path: "/company/contracts" },
      { text: "Progress", icon: ChartBar, path: "/company/progress" },
      { text: "Payments", icon: Wallet, path: "/company/payments" },
      { text: "Messages", icon: ChatCircleText, path: "/company/messages" },
      { text: "Notifications", icon: Bell, path: "/company/notifications" },
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
      { text: "Payments", icon: Wallet, path: "/vendor/payments" },
      { text: "Messages", icon: ChatCircleText, path: "/vendor/messages" },
      { text: "Notifications", icon: Bell, path: "/vendor/notifications" },
      { text: "Feedback", icon: Feedback, path: "/vendor/feedback" },
    ],
  },
};

const PAGE_SUBTITLES = {
  "/admin": "Overview of platform activity and growth",
  "/admin/users": "Manage and monitor all platform users",
  "/admin/pending": "Review pending company and vendor accounts",
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
  "/company/proposals": "Review vendor submissions and decide next actions",
  "/company/feedback": "Share your experience and suggestions",
  "/vendor": "Track proposal performance and earnings momentum",
  "/vendor/available-tasks": "Browse and apply for tasks that match your skills",
  "/vendor/my-proposals": "Track your submitted proposals and outcomes",
  "/vendor/contracts": "Track accepted proposals and active work commitments",
  "/vendor/feedback": "Share your experience and suggestions",
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

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

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("SignOut failed:", error);
    }
  };

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed((current) => !current);
  };

  const { main = [] } = MENU_CONFIG[role] || {};

  const pageTitle = useMemo(() => {
    const exactMatch = main.find((item) => item.path === location.pathname);
    if (exactMatch) return exactMatch.text;

    const prefixMatch = main.find(
      (item) => item.path !== `/${role}` && location.pathname.startsWith(`${item.path}/`)
    );
    if (prefixMatch) return prefixMatch.text;

    const lastSegment = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
    return lastSegment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }, [location.pathname, main, role]);

  const pageSubtitle = useMemo(() => {
    const settingsPath = `/${role}/settings`;
    if (location.pathname === settingsPath) return "Manage your account preferences";
    return PAGE_SUBTITLES[location.pathname] || "";
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

      <main className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out border border-border bg-card rounded-2xl overflow-hidden shadow-sm",
        isSidebarCollapsed ? "lg:ml-[112px]" : "lg:ml-[288px]"
      )}>
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
            <Outlet />
          </div>
        </div>
      </main>

      {role !== "admin" && <FloatingChatButton />}
    </div>
  );
};

export default DashboardLayout;



