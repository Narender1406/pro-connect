import api from "./axios";

export const notificationAPI = {
  // Get notifications
  getNotifications: async (unreadOnly = false) => {
    const res = await api.get("/notifications", {
      params: { unreadOnly },
    });
    return res.data;
  },

  // Mark as read
  markAsRead: async (notificationId: string) => {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const res = await api.patch("/notifications/read-all");
    return res.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const res = await api.delete(`/notifications/${notificationId}`);
    return res.data;
  },
};
