import api from "./api";
import { getUserData } from "../lib/localStorage";

const isAuthenticated = () => {
    const user = getUserData();
    return !!(user && user.id && user.role);
};

export const paymentAPI = {
  // Wallet endpoints
  getWallet: async () => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get("/payments/wallet");
  },

  depositMoney: async (data) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.post("/payments/deposit", data);
  },

  requestWithdrawal: async (data) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.post("/payments/withdraw", data);
  },

  confirmPayment: async (paymentId) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.post(`/payments/payment/confirm/${paymentId}`);
  },

  // Company endpoints
  getCompanyActiveTasks: async () => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get("/payments/company/active-tasks");
  },

  makePayment: async (data) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.post("/payments/make-payment", data);
  },

  // Vendor endpoints
  getVendorActiveTasks: async () => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get("/payments/vendor/active-tasks");
  },

  getVendorPaymentSummary: async () => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get("/payments/vendor/summary");
  },

  requestPayment: async (data) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.post("/payments/request-payment", data);
  },

  // Admin endpoints
  getAllTransactions: async (params) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get("/payments/admin/transactions", { params });
  },

  getAllPayments: async (params) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get("/payments/admin/payments", { params });
  },

  processWithdrawal: async (data) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.post("/payments/admin/process-withdrawal", data);
  },

  // Common endpoints
  getPaymentById: async (id) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get(`/payments/${id}`);
  },

  getContractPayments: async (contractId) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    return api.get(`/payments/contract/${contractId}`);
  },

  downloadInvoice: async (id) => {
    if (!isAuthenticated()) throw new Error("Not authenticated");
    const response = await api.get(`/payments/${id}/invoice`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${id.slice(-8)}.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },
};
