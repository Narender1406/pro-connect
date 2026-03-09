import api from "./axios";

export const searchAPI = {
  searchUsers: async (query: string) => {
    const res = await api.get("/search/users", { params: { q: query } });
    return res.data;
  },

  getUserById: async (userId: string) => {
    const res = await api.get(`/search/users/${userId}`);
    return res.data;
  },
};
