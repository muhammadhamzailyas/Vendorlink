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
import { usePageMetaContext } from "../../context/PageMetaContext";

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

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const { meta } = usePageMetaContext();

  const role = user?.role;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

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
          pageTitle={meta.title}
          pageSubtitle={meta.subtitle}
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
