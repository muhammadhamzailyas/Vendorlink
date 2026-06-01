import axios from "axios";
import { getAuthToken, removeToken } from "../lib/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Debug interceptor for network errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error("Network Error or DNS issue:", error.message);
        }
        return Promise.reject(error);
    }
);

/**
 * Interceptor to attach JWT Token to every request.
 */
api.interceptors.request.use((config) => {
  const publicRoutes = [
    "/onboarding/plans", 
    "/auth/login", 
    "/auth/register", 
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/resend-verification"
  ];
  const isPublic = publicRoutes.some(route => config.url.includes(route));

  if (isPublic) return config;

  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Definitive: No active session. Abort request to prevent 401 noise.
    const controller = new AbortController();
    config.signal = controller.signal;
    controller.abort("AUTH_REQUIRED");
  }
  return config;
});

export const onboardingService = {
  createPaymentIntent: () => api.post("/onboarding/create-payment-intent"),
  saveProgress: (data) => api.post("/onboarding/save-progress", data, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  resetProgress: () => api.post("/onboarding/reset-progress"),
  getMyOnboarding: () => api.get("/onboarding/me"),
  submitFinal: (data) => api.post("/onboarding/final-submit", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export const authService = {
  /**
   * Login with email and password
   */
  login: (email, password) => api.post("/auth/login", { email, password }),

  /**
   * Register a new user
   */
  register: (email, password, fullName) => api.post("/auth/register", { email, password, fullName }),

  /**
   * Forgot password request
   */
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  /**
   * Reset password with token
   */
  resetPassword: (token, newPassword) => api.put("/auth/reset-password", { token, newPassword }),
  
  /**
   * Verify email with code
   */
  verifyEmail: (email, code) => api.post("/auth/verify-email", { email, code }),

  /**
   * Resend verification code
   */
  resendVerificationCode: (email) => api.post("/auth/resend-verification", { email }),

  /**
   * Fetches the current user profile using JWT.
   */
  getMe: () => api.get("/auth/me"),
};

export const taskAPI = {
  createTask: (data) => api.post("/tasks", data),
  getAllTasks: (params) => api.get("/tasks", { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  getCompanyTasks: () => api.get("/tasks/company/my-tasks"),
  getVendorTasks: () => api.get("/tasks/vendor/my-tasks"),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  checkDeletability: (id) => api.get(`/tasks/${id}/check-deletability`),
};

export const proposalAPI = {
  createProposal: (data) => api.post("/proposals", data),
  getTaskProposals: (taskId) => api.get(`/proposals/task/${taskId}`),
  getVendorProposals: () => api.get("/proposals/vendor/my-proposals"),
  getCompanyProposals: () => api.get("/proposals/company/received"),
  updateProposalStatus: (id, status) => api.put(`/proposals/${id}/status`, { status }),
  getProposal: (id) => api.get(`/proposals/${id}`),
  accept: (id) => api.put(`/proposals/${id}/accept`),
  reject: (id) => api.put(`/proposals/${id}/reject`),
  updateProposal: (id, data) => api.put(`/proposals/${id}`, data),
  deleteProposal: (id) => api.delete(`/proposals/${id}`),
  checkDeletability: (id) => api.get(`/proposals/${id}/check-deletability`),
};

export const contractAPI = {
  createCompleteContract: (data) => api.post("/contracts", data),
  createFromProposal: (proposalId) => api.post("/contracts/create-from-proposal", { proposalId }),
  getCompanyContracts: (status) => api.get("/contracts/company/my-contracts", { params: { status } }),
  getVendorContracts: (status) => api.get("/contracts/vendor/my-contracts", { params: { status } }),
  getActiveContracts: () => api.get("/contracts/vendor/active"),
  getContractById: (id) => api.get(`/contracts/${id}`),
  checkDeletability: (id) => api.get(`/contracts/${id}/check-deletability`),
  approveContract: (id, data) => api.put(`/contracts/${id}/approve`, data),
  rejectContract: (id, reason) => api.put(`/contracts/${id}/reject`, { reason }),
  cancelContract: (id, reason) => api.put(`/contracts/${id}/cancel`, { reason }),
  downloadContract: (id) => api.get(`/contracts/${id}/download`),
  addNote: (id, content) => api.post(`/contracts/${id}/notes`, { content }),
  deleteContract: (id) => api.delete(`/contracts/${id}`),
};

export const progressAPI = {
  getVendorActiveTasks: () => api.get("/progress/vendor/active-contracts"),
  getCompanyActiveTasks: () => api.get("/progress/company/active-contracts"),
  getTaskProgress: (taskId, isCompany = false) => 
    api.get(isCompany ? `/progress/company/task/${taskId}/progress` : `/progress/task/${taskId}`),
  addProgressUpdate: (taskId, data) => api.post(`/progress/task/${taskId}/update`, data),
  requestCompletion: (taskId) => api.post(`/progress/task/${taskId}/complete`),
  approveCompletion: (taskId) => api.post(`/progress/company/task/${taskId}/approve-completion`),
  getPaymentReadiness: (taskId) => api.get(`/progress/task/${taskId}/payment-readiness`),
  getPaymentSummary: (taskId) => api.get(`/progress/task/${taskId}/payment-summary`),
  getProgressHistory: (taskId, isCompany = false) => 
    api.get(isCompany ? `/progress/company/task/${taskId}/history` : `/progress/task/${taskId}/history`),
  exportReport: (taskId) => api.get(`/progress/company/task/${taskId}/export`, { responseType: 'blob' }),
};

export const notificationAPI = {
  getUserNotifications: (page = 1, limit = 20) =>
    api.get("/notifications", { params: { page, limit } }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/mark-all-read"),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteReadNotifications: () => api.delete("/notifications/read/all"),
};

export const chatAPI = {
  getConversations: () => api.get("/chat/conversations"),
  getPartners: () => api.get("/chat/partners"),
  getTaskMessages: (taskId) => api.get(`/chat/messages/${taskId}`),
  sendMessage: (data) => api.post("/chat/message", data),
  startConversation: (taskId) => api.post("/chat/conversation", { taskId }),
  getUnreadCount: () => api.get("/chat/unread"),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

export const adminService = {
  getAllUsers: () => api.get("/admin/users"),
  getAllTasks: () => api.get("/tasks"),
  getPendingUsers: () => api.get("/admin/pending"),
  getPendingVerifications: () => api.get("/admin/pending-verifications"),
  approveUser: (id) => api.put(`/admin/approve/${id}`),
  rejectUser: (id, reason) => api.put(`/admin/reject/${id}`, { reason }),
  approveVerification: (id) => api.put(`/admin/approve-verification/${id}`),
  rejectVerification: (id, data) => api.put(`/admin/reject-verification/${id}`, data),
  getStats: () => api.get("/admin/stats"),
  getAuditLogs: () => api.get("/admin/audit-logs"),
  archiveUser: (id, reason) => api.put(`/admin/archive/${id}`, { reason }),
  softDeleteUser: (id, data) => api.put(`/admin/archive/${id}`, data),
  checkDeletion: (id) => api.get(`/admin/check-deletion/${id}`),
  restoreUser: (id) => api.put(`/admin/restore/${id}`),
  getTaskReport: (format = "json") => api.get(`/admin/reports/tasks?format=${format}`, { responseType: format === "pdf" ? "blob" : "json" }),
  getUserReport: (format = "json") => api.get(`/admin/reports/users?format=${format}`, { responseType: format === "pdf" ? "blob" : "json" }),
  getFinanceReport: (format = "json") => api.get(`/admin/reports/finance?format=${format}`, { responseType: format === "pdf" ? "blob" : "json" }),
  getTaskMonitoring: () => api.get("/admin/monitoring/tasks"),
  getContractMonitoring: () => api.get("/admin/monitoring/contracts"),
  getGlobalActivity: () => api.get("/admin/activity"),
  getSystemHealth: () => api.get("/admin/monitoring/health"),
  getAllContracts: () => api.get("/admin/contracts"),
  getSupportTickets: () => api.get("/admin/support/tickets"),
  resolveTicket: (id) => api.put(`/admin/support/tickets/${id}/resolve`),
  getAdminSettings: () => api.get("/admin/settings"),
  updateAdminSettings: (data) => api.put("/admin/settings", data),
  getTaskAudit: (id) => api.get(`/admin/audit/task/${id}`),
  generateAdminReport: (format = "pdf") => api.get(`/admin/generate-report?format=${format}`),
};

export default api;
