import api from "./api";

export const paymentAPI = {
  // Wallet endpoints
  getWallet: async () => {
    return api.get("/payments/wallet");
  },

  depositMoney: async (data) => {
    return api.post("/payments/deposit", data);
  },

  requestWithdrawal: async (data) => {
    return api.post("/payments/withdraw", data);
  },

  confirmPayment: async (paymentId) => {
    return api.post(`/payments/payment/confirm/${paymentId}`);
  },

  // Company endpoints
  getCompanyActiveTasks: async () => {
    return api.get("/payments/company/active-tasks");
  },

  makePayment: async (data) => {
    return api.post("/payments/make-payment", data);
  },

  // Vendor endpoints
  getVendorActiveTasks: async () => {
    return api.get("/payments/vendor/active-tasks");
  },

  getVendorPaymentSummary: async () => {
    return api.get("/payments/vendor/summary");
  },

  requestPayment: async (data) => {
    return api.post("/payments/request-payment", data);
  },

  // Admin endpoints
  getAllTransactions: async (params) => {
    return api.get("/payments/admin/transactions", { params });
  },

  getAllPayments: async (params) => {
    return api.get("/payments/admin/payments", { params });
  },

  processWithdrawal: async (data) => {
    return api.post("/payments/admin/process-withdrawal", data);
  },

  // Common endpoints
  getPaymentById: async (id) => {
    return api.get(`/payments/${id}`);
  },

  getContractPayments: async (contractId) => {
    return api.get(`/payments/contract/${contractId}`);
  },

  downloadInvoice: async (id) => {
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
