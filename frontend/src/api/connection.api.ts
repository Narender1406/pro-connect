import api from "./axios";

export const connectionAPI = {
  // Send connection request
  sendRequest: async (recipientId: string, message?: string) => {
    const res = await api.post("/connections/request", { recipientId, message });
    return res.data;
  },

  // Accept connection
  acceptConnection: async (connectionId: string) => {
    const res = await api.post(`/connections/${connectionId}/accept`);
    return res.data;
  },

  // Reject connection
  rejectConnection: async (connectionId: string) => {
    const res = await api.post(`/connections/${connectionId}/reject`);
    return res.data;
  },

  // Get my connections
  getConnections: async () => {
    const res = await api.get("/connections");
    return res.data;
  },

  // Get pending requests
  getPendingRequests: async () => {
    const res = await api.get("/connections/requests");
    return res.data;
  },

  // Get suggestions
  getSuggestions: async () => {
    const res = await api.get("/connections/suggestions");
    return res.data;
  },

  // Remove connection
  removeConnection: async (connectionId: string) => {
    const res = await api.delete(`/connections/${connectionId}`);
    return res.data;
  },
};
