// App entry point
import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  Routes,
  Route,
  BrowserRouter as Router,
  Navigate,
} from "react-router-dom";
import { ToastViewport } from "./lib/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authService } from "./services/api";

import { auth } from "./lib/firebase";
import { onIdTokenChanged } from "firebase/auth";

import ProtectedRoutes from "./components/ProtectedRoutes";
import DashboardLayout from "./components/layout/DashboardLayout";
import { NotificationProvider } from "./context/NotificationContext";
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";

/**
 * Hook to manage Firebase user session and sync with MongoDB profile.
 */
const useUserSession = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Small delay to allow Firebase to settle
          await new Promise(r => setTimeout(r, 200));
          
          // Get fresh token
          await firebaseUser.getIdToken(true);
          
          const response = await authService.sessionBootstrap();
          const { user, needsOnboarding } = response.data;
          
          if (needsOnboarding) {
            const idToken = await firebaseUser.getIdToken();
            const syncRes = await authService.firebaseLogin(idToken);
            const syncedUser = syncRes.data?.user || syncRes.user;
            localStorage.setItem("user", JSON.stringify(syncedUser));
          } else if (user) {
            localStorage.setItem("user", JSON.stringify(user));
          }
          
          window.dispatchEvent(new CustomEvent("userStatusUpdated", { detail: user || {} }));
        } catch (error) {
          if (error.response?.status === 401) {
            console.warn("Unauthorized session, clearing local storage");
            localStorage.removeItem("user");
          } else {
            console.error("Session sync error:", error.message);
          }
        }
      } else {
        localStorage.removeItem("user");
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  return { isInitializing };
};

const UserSessionProvider = ({ children }) => {
  const { isInitializing } = useUserSession();
  if (isInitializing) return <Loader text="Synchronizing session..." />;
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
        <div className="flex min-h-screen items-center justify-center bg-[var(--muted)] p-6">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Something went wrong.
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
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

import { Button, Loader } from "./components/ui";

const LandingPage = lazy(() => import("./pages/landing/LandingPage.jsx"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const VerifyPending = lazy(() => import("./pages/auth/VerifyPending"));
const LinkedInCallback = lazy(() => import("./pages/auth/LinkedInCallback"));
const Payment = lazy(() => import("./pages/auth/Payment"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
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
const VendorMarketplace = lazy(
  () => import("./pages/company/VendorMarketplace")
,);
const MyTaskPage = lazy(() => import("./pages/company/MyTaskPage"));
const CompanyProfile = lazy(() => import("./pages/company/Profile"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorTaskDetail = lazy(() => import("./pages/vendor/VendorTaskDetail"));
const AvailableTasks = lazy(() => import("./pages/vendor/AvailableTasks"));
const MyProposals = lazy(() => import("./pages/vendor/MyProposals"));
const VendorContracts = lazy(() => import("./pages/vendor/Contracts"));
const VendorProfile = lazy(() => import("./pages/vendor/Profile"));
const SharedSettings = lazy(() => import("./pages/shared/Settings"));
const SharedFeedback = lazy(() => import("./pages/shared/Feedback"));

// New feature pages
const ChatPage = lazy(() => import("./pages/shared/ChatPage"));
const NotificationsPage = lazy(
  () => import("./pages/shared/NotificationsPage"),
);
const ContractDetail = lazy(() => import("./pages/shared/ContractDetail"));
const CompanyContracts = lazy(() => import("./pages/company/Contracts"));
const CompanyProgress = lazy(() => import("./pages/company/CompanyProgress"));
const CompanyTaskProgressDetail = lazy(
  () => import("./pages/company/CompanyTaskProgressDetail"),
);
const CreateContract = lazy(() => import("./pages/company/CreateContract"));
const VendorProgress = lazy(() => import("./pages/vendor/VendorProgress"));
const VendorTaskProgressDetail = lazy(
  () => import("./pages/vendor/TaskProgressDetail"),
);

// Payment & AI features
const CompanyPayments = lazy(() => import("./pages/company/Payments"));
const VendorPayments = lazy(() => import("./pages/vendor/Payments"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminPaymentDetail = lazy(() => import("./pages/admin/PaymentDetail"));
const AdminTransactions = lazy(() => import("./pages/admin/Transactions"));
const PaymentSuccess = lazy(() => import("./pages/shared/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/shared/PaymentCancel"));

import FloatingChatButton from "./components/FloatingChatButton";
import ScrollToTop from "./components/ScrollToTop";

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
      <FloatingChatButton />
    </ErrorBoundary>
  </ProtectedRoutes>
);

const VendorLayout = () => (
  <ProtectedRoutes role="vendor">
    <ErrorBoundary>
      <DashboardLayout />
      <FloatingChatButton />
    </ErrorBoundary>
  </ProtectedRoutes>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastViewport />
        <Router>
          <ScrollToTop />
          <UserSessionProvider>
            <NotificationProvider>
              <WalletProvider>
                <Suspense fallback={<Loader />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/verify-pending" element={<VerifyPending />} />
                    <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/payment" element={<Payment />} />

                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="pending" element={<Pending />} />
                      <Route
                        path="task-monitoring"
                        element={<TaskMonitoring />}
                      />
                      <Route path="contract" element={<SharedContract />} />
                      <Route path="contract/:id" element={<ContractDetail />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="messages" element={<ChatPage />} />
                      <Route
                        path="notifications"
                        element={<NotificationsPage />}
                      />
                      <Route path="payments" element={<AdminPayments />} />
                      <Route
                        path="payments/:id"
                        element={<AdminPaymentDetail />}
                      />
                      <Route
                        path="transactions"
                        element={<AdminTransactions />}
                      />
                    </Route>

                    <Route path="/company" element={<CompanyLayout />}>
                      <Route index element={<CompanyDashboard />} />
                      <Route path="add-task" element={<AddTaskForm />} />
                      <Route
                        path="vendor-marketplace"
                        element={<VendorMarketplace />}
                      />
                      <Route path="my-tasks" element={<MyTaskPage />} />
                      <Route path="contract" element={<SharedContract />} />
                      <Route path="contracts" element={<CompanyContracts />} />
                      <Route
                        path="contract/create"
                        element={<CreateContract />}
                      />
                      <Route path="contract/:id" element={<ContractDetail />} />
                      <Route path="profile" element={<CompanyProfile />} />
                      <Route path="tasks" element={<MyTaskPage />} />
                      <Route path="proposals" element={<CompanyProposals />} />
                      <Route path="task/:id" element={<CompanyTaskDetail />} />
                      <Route path="progress" element={<CompanyProgress />} />
                      <Route
                        path="task/:taskId/progress"
                        element={<CompanyTaskProgressDetail />}
                      />
                      <Route path="messages" element={<ChatPage />} />
                      <Route
                        path="notifications"
                        element={<NotificationsPage />}
                      />
                      <Route path="settings" element={<SharedSettings />} />
                      <Route path="feedback" element={<SharedFeedback />} />
                      <Route path="payments" element={<CompanyPayments />} />
                    </Route>

                    <Route path="/vendor" element={<VendorLayout />}>
                      <Route index element={<VendorDashboard />} />
                      <Route
                        path="available-tasks"
                        element={<AvailableTasks />}
                      />
                      <Route path="my-proposals" element={<MyProposals />} />
                      <Route path="contracts" element={<VendorContracts />} />
                      <Route path="contract/:id" element={<ContractDetail />} />
                      <Route path="profile" element={<VendorProfile />} />
                      <Route path="task/:id" element={<VendorTaskDetail />} />
                      <Route path="progress" element={<VendorProgress />} />
                      <Route
                        path="task/:taskId/progress"
                        element={<VendorTaskProgressDetail />}
                      />
                      <Route path="messages" element={<ChatPage />} />
                      <Route
                        path="notifications"
                        element={<NotificationsPage />}
                      />
                      <Route path="settings" element={<SharedSettings />} />
                      <Route path="feedback" element={<SharedFeedback />} />
                      <Route path="payments" element={<VendorPayments />} />
                    </Route>

                    <Route
                      path="/payment-success"
                      element={<PaymentSuccess />}
                    />
                    <Route path="/payment-cancel" element={<PaymentCancel />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </WalletProvider>
            </NotificationProvider>
          </UserSessionProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
