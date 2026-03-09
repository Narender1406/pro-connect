import api from "./axios";

export const messageAPI = {
  getConversations: async () => {
    const res = await api.get("/messages/conversations");
    return res.data;
  },

  getMessages: async (userId: string) => {
    const res = await api.get(`/messages/${userId}`);
    return res.data;
  },

  sendMessage: async (recipientId: string, content: string) => {
    const res = await api.post("/messages", { recipientId, content });
    return res.data;
  },

  markAsRead: async (userId: string) => {
    const res = await api.patch(`/messages/${userId}/read`);
    return res.data;
  },
};
