import api from "./axios";

export const getFeed = async (page = 1, limit = 10) => {
  const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
  return response.data;
};

export const createPost = async (content: string, media?: any[]) => {
  const response = await api.post("/posts", { content, media });
  return response.data;
};

export const toggleLike = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/like`);
  return response.data;
};

export const addComment = async (postId: string, text: string) => {
  const response = await api.post(`/posts/${postId}/comment`, { text });
  return response.data;
};

export const incrementShare = async (postId: string) => {
  const response = await api.post(`/posts/${postId}/share`);
  return response.data;
};

export const updatePost = async (postId: string, data: any) => {
  const response = await api.put(`/posts/${postId}`, data);
  return response.data;
};

export const deletePost = async (postId: string) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

export const postAPI = {
  getFeed,
  createPost,
  toggleLike,
  addComment,
  incrementShare,
  updatePost,
  deletePost,
  getUserPosts: (userId: string) => api.get(`/posts/user/${userId}`),
};
