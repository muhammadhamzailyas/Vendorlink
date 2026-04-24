import axios from "axios";
import { getFirebaseIdToken } from "../lib/firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8002/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

/**
 * Interceptor to attach Firebase ID Token to every request.
 * This is the ONLY authentication source trusted by the backend.
 */
api.interceptors.request.use(async (config) => {
  const publicRoutes = ["/onboarding/plans"];
  const isPublic = publicRoutes.some(route => config.url.includes(route));

  // Skip token logic for bootstrapping itself or static public assets
  if (isPublic) return config;

  try {
    // 1. Wait for auth state to be resolved (not null/initializing)
    const token = await getFirebaseIdToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // 2. Definitive: No active session. Abort request to prevent 401 noise.
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort("AUTH_REQUIRED");
    }
  } catch {
    // Silently abort on auth error
    const controller = new AbortController();
    config.signal = controller.signal;
    controller.abort("AUTH_ERROR");
  }
  return config;
});

export const onboardingService = {
  getPlans: () => api.get("/onboarding/plans"),
  createPaymentIntent: (planId) => api.post("/onboarding/create-payment-intent", { planId }),
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
   * Syncs the Firebase identity with MongoDB and returns the user profile.
   */
  firebaseLogin: async (idToken) => {
    const response = await api.post("/auth/firebase-login", { idToken });
    return response.data;
  },
  
  /**
   * Fetches the current MongoDB user profile using the current Firebase session.
   */
  getMe: () => api.get("/auth/me"),

  /**
   * Bootstraps the session on app load to determine onboarding status.
   */
  sessionBootstrap: () => api.get("/auth/session/bootstrap"),

  /**
   * Clears local state. Actual logout is handled via Firebase SDK.
   */
  logout: () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

export const taskAPI = {
  createTask: (data) => api.post("/tasks", data),
  getAllTasks: (params) => api.get("/tasks", { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  getCompanyTasks: () => api.get("/tasks/company/my-tasks"),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
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
};

export const contractAPI = {
  createCompleteContract: (data) => api.post("/contracts", data),
  createFromProposal: (proposalId) => api.post("/contracts/create-from-proposal", { proposalId }),
  getCompanyContracts: (status) => api.get("/contracts/company/my-contracts", { params: { status } }),
  getVendorContracts: (status) => api.get("/contracts/vendor/my-contracts", { params: { status } }),
  getActiveContracts: () => api.get("/contracts/vendor/active"),
  getContractById: (id) => api.get(`/contracts/${id}`),
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
    api.get(isCompany ? `/progress/company/task/${taskId}` : `/progress/task/${taskId}`),
  addProgressUpdate: (taskId, data) => api.post(`/progress/task/${taskId}/update`, data),
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
  getChats: () => api.get("/chat"),
  getMessages: (chatId) => api.get(`/chat/${chatId}/messages`),
  getTaskMessages: (taskId) => api.get(`/chat/task/${taskId}`), // Added for useChat
  sendMessage: function(arg1, arg2) {
    // If arg1 is a string, it's chatId, arg2 is text
    if (typeof arg1 === 'string') {
        return api.post(`/chat/${arg1}/messages`, { text: arg2 });
    }
    // Otherwise arg1 is the complex payload {receiverId, message, taskId}
    return api.post("/chat/send", arg1);
  },
  startChat: (vendorId, taskId) => api.post("/chat/start", { vendorId, taskId }),
};

export const adminService = {
  getAllUsers: () => api.get("/admin/users"),
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
  getSystemHealth: () => api.get("/admin/monitoring/health"),
  getSupportTickets: () => api.get("/admin/support/tickets"),
  resolveTicket: (id) => api.put(`/admin/support/tickets/${id}/resolve`),
  getAdminSettings: () => api.get("/admin/settings"),
  updateAdminSettings: (data) => api.put("/admin/settings", data),
  getTaskAudit: (id) => api.get(`/admin/audit/task/${id}`),
  generateAdminReport: (format = "pdf") => api.get(`/admin/generate-report?format=${format}`),
};

export default api;


