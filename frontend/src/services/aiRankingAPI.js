import api from "./api";

export const aiRankingAPI = {
  rankProposals: async (taskId) => {
    try {
      const response = await api.post(`/ai/rank/${taskId}`);
      return response;
    } catch (error) {
      // If we get a fallback response, still return it
      if (error.response?.data?.fallback) {
        return error.response;
      }
      throw error;
    }
  },

  getVendorHistory: async (vendorId) => {
    return api.get(`/ai/vendor-history/${vendorId}`);
  },
};


