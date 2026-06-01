// App entry point
import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ToastViewport, showToast } from "./lib/toast";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { removeToken } from "./lib/auth";

import ProtectedRoutes from "./components/ProtectedRoutes";
import DashboardLayout from "./components/layout/DashboardLayout";
import { NotificationProvider } from "./context/NotificationContext";
import { WalletProvider } from "./context/WalletContext";
import { UserProvider, useUser } from "./context/UserContext";
import { PageMetaProvider } from "./context/PageMetaContext";
import { Button, Loader } from "./components/ui";
import ScrollToTop from "./components/ScrollToTop";

const UserSessionProvider = ({ children }) => {
  const { loading } = useUser();
  if (loading) return <Loader />;
  return children;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Something went wrong.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please reload the page to continue.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LandingPage = lazy(() => import("./pages/landing/LandingPage.jsx"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));
const EmailVerification = lazy(() => import("./pages/auth/EmailVerification"));
const Payment = lazy(() => import("./pages/auth/Payment"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const TermsOfService = lazy(() => import("./pages/auth/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/auth/PrivacyPolicy"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const Pending = lazy(() => import("./pages/admin/Pending"));
const TaskMonitoring = lazy(() => import("./pages/admin/TaskMonitoring"));
const SharedContract = lazy(() => import("./pages/shared/Contract"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const CompanyDashboard = lazy(() => import("./pages/company/CompanyDashboard"));
const CompanyProposals = lazy(() => import("./pages/company/CompanyProposal"));
const AddTaskForm = lazy(() => import("./pages/company/AddTask"));
const CompanyTaskDetail = lazy(() => import("./pages/company/TaskDetail"));
const MyTaskPage = lazy(() => import("./pages/company/MyTaskPage"));
const UserProfilePage = lazy(() => import("./pages/shared/UserProfilePage"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorTaskDetail = lazy(() => import("./pages/vendor/VendorTaskDetail"));
const AvailableTasks = lazy(() => import("./pages/vendor/AvailableTasks"));
const MyProposals = lazy(() => import("./pages/vendor/MyProposals"));
const VendorContracts = lazy(() => import("./pages/vendor/Contracts"));
const SharedSettings = lazy(() => import("./pages/shared/Settings"));
const SharedFeedback = lazy(() => import("./pages/shared/FeedbackPage"));
const AdminFeedback = lazy(() => import("./pages/admin/FeedbackPage"));
const ChatPage = lazy(() => import("./pages/shared/ChatPage"));
const NotificationsPage = lazy(() => import("./pages/shared/NotificationsPage"));
const ContractDetail = lazy(() => import("./pages/shared/ContractDetail"));
const CompanyContracts = lazy(() => import("./pages/company/Contracts"));
const CompanyProgress = lazy(() => import("./pages/company/CompanyProgress"));
const CompanyTaskProgressDetail = lazy(() => import("./pages/company/CompanyTaskProgressDetail"));
const CreateContract = lazy(() => import("./pages/company/CreateContract"));
const VendorProgress = lazy(() => import("./pages/vendor/VendorProgress"));
const VendorTaskProgressDetail = lazy(() => import("./pages/vendor/TaskProgressDetail"));
const SharedPayments = lazy(() => import("./pages/shared/Payments"));
const AdminPaymentDetail = lazy(() => import("./pages/admin/PaymentDetail"));
const AdminTransactions = lazy(() => import("./pages/admin/Transactions"));
const PaymentSuccess = lazy(() => import("./pages/shared/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/shared/PaymentCancel"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AppLayout = () => (
    <>
        <ScrollToTop />
        <UserProvider>
            <PageMetaProvider>
                <UserSessionProvider>
                    <NotificationProvider>
                        <WalletProvider>
                            <Suspense fallback={<Loader />}>
                                <Outlet />
                            </Suspense>
                        </WalletProvider>
                    </NotificationProvider>
                </UserSessionProvider>
            </PageMetaProvider>
        </UserProvider>
    </>
);

const AdminLayout = () => (
  <ProtectedRoutes role="admin">
    <ErrorBoundary>
      <DashboardLayout />
    </ErrorBoundary>
  </ProtectedRoutes>
);

const CompanyLayout = () => (
  <ProtectedRoutes role="company">
    <ErrorBoundary>
      <DashboardLayout />
    </ErrorBoundary>
  </ProtectedRoutes>
);

const VendorLayout = () => (
  <ProtectedRoutes role="vendor">
    <ErrorBoundary>
      <DashboardLayout />
    </ErrorBoundary>
  </ProtectedRoutes>
);

const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <Loader />;
  if (user && user.role !== "unassigned" && user.profileCompleted) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <PublicRoute><Login /></PublicRoute> },
      { path: "signup", element: <PublicRoute><Signup /></PublicRoute> },
      { path: "auth/callback", element: <AuthCallback /> },
      { path: "auth/verify-email", element: <EmailVerification /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "auth/reset-password", element: <ResetPassword /> },
      { path: "terms", element: <TermsOfService /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "payment", element: <Payment /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "users", element: <UserManagement /> },
          { path: "pending", element: <Pending /> },
          { path: "task-monitoring", element: <TaskMonitoring /> },
          { path: "contract", element: <SharedContract /> },
          { path: "contract/:id", element: <ContractDetail /> },
          { path: "reports", element: <Reports /> },
          { path: "settings", element: <AdminSettings /> },
          { path: "messages", element: <ChatPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "payments", element: <SharedPayments role="admin" /> },
          { path: "payments/:id", element: <AdminPaymentDetail /> },
          { path: "transactions", element: <AdminTransactions /> },
          { path: "feedback", element: <AdminFeedback /> },
        ],
      },
      {
        path: "company",
        element: <CompanyLayout />,
        children: [
          { index: true, element: <CompanyDashboard /> },
          { path: "add-task", element: <AddTaskForm /> },
          { path: "my-tasks", element: <MyTaskPage /> },
          { path: "contract", element: <SharedContract /> },
          { path: "contracts", element: <CompanyContracts /> },
          { path: "contract/create", element: <CreateContract /> },
          { path: "contract/:id", element: <ContractDetail /> },
          { path: "profile", element: <UserProfilePage userType="company" /> },
          { path: "tasks", element: <MyTaskPage /> },
          { path: "proposals", element: <CompanyProposals /> },
          { path: "task/:id", element: <CompanyTaskDetail /> },
          { path: "progress", element: <CompanyProgress /> },
          { path: "task/:taskId/progress", element: <CompanyTaskProgressDetail /> },
          { path: "messages", element: <ChatPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "settings", element: <SharedSettings /> },
          { path: "feedback", element: <SharedFeedback /> },
          { path: "payments", element: <SharedPayments role="company" /> },
        ],
      },
      {
        path: "vendor",
        element: <VendorLayout />,
        children: [
          { index: true, element: <VendorDashboard /> },
          { path: "available-tasks", element: <AvailableTasks /> },
          { path: "my-proposals", element: <MyProposals /> },
          { path: "contracts", element: <VendorContracts /> },
          { path: "contract/:id", element: <ContractDetail /> },
          { path: "profile", element: <UserProfilePage userType="vendor" /> },
          { path: "task/:id", element: <VendorTaskDetail /> },
          { path: "progress", element: <VendorProgress /> },
          { path: "task/:taskId/progress", element: <VendorTaskProgressDetail /> },
          { path: "messages", element: <ChatPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "settings", element: <SharedSettings /> },
          { path: "feedback", element: <SharedFeedback /> },
          { path: "payments", element: <SharedPayments role="vendor" /> },
        ],
      },
      { path: "payment-success", element: <PaymentSuccess /> },
      { path: "payment-cancel", element: <PaymentCancel /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error?.response?.status === 401) {
        removeToken();
        window.location.href = "/login";
      } else if (error?.response?.status >= 500) {
        showToast("error", "Server error. Please try again later.");
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "./lib/stripe";

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Elements stripe={stripePromise}>
        <ToastViewport />
        <RouterProvider router={router} />
      </Elements>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

