import api from './api'

export const postService = {
  getFeed: (page = 1, limit = 20) => api.get('/posts', { params: { page, limit } }),
  getTrending: () => api.get('/posts/trending'),
  getByHashtag: (tag: string, page = 1) => api.get(`/posts/hashtag/${tag}`, { params: { page } }),
  getPost: (id: string) => api.get(`/posts/${id}`),
  createPost: (data: { content: string; post_type?: string; media_urls?: string[]; hashtags?: string[]; mentions?: string[]; visibility?: string }) =>
    api.post('/posts', data),
  updatePost: (id: string, data: { content: string }) => api.put(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  likePost: (id: string) => api.post(`/posts/${id}/like`),
  unlikePost: (id: string) => api.delete(`/posts/${id}/like`),
  savePost: (id: string) => api.post(`/posts/${id}/save`),
  unsavePost: (id: string) => api.delete(`/posts/${id}/save`),
  sharePost: (id: string) => api.post(`/posts/${id}/share`),
  getComments: (id: string, page = 1) => api.get(`/posts/${id}/comments`, { params: { page } }),
  addComment: (id: string, content: string, parent_id?: string) => api.post(`/posts/${id}/comments`, { content, parent_id }),
  updateComment: (postId: string, commentId: string, content: string) => api.put(`/posts/${postId}/comments/${commentId}`, { content }),
  deleteComment: (postId: string, commentId: string) => api.delete(`/posts/${postId}/comments/${commentId}`),
  likeComment: (postId: string, commentId: string) => api.post(`/posts/${postId}/comments/${commentId}/like`),
}

export const userService = {
  searchUsers: (params: { q?: string; page?: number; limit?: number; open_to_work?: boolean }) => api.get('/users', { params }),
  getProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: object) => api.put('/users/me/profile', data),
  uploadAvatar: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadCover: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/users/me/cover', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  uploadResume: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/users/me/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  followUser: (id: string) => api.post(`/users/${id}/follow`),
  unfollowUser: (id: string) => api.delete(`/users/${id}/unfollow`),
  getFollowers: (id: string, page = 1) => api.get(`/users/${id}/followers`, { params: { page } }),
  getFollowing: (id: string, page = 1) => api.get(`/users/${id}/following`, { params: { page } }),
  getPersonalizedFeed: (page = 1) => api.get('/users/me/feed', { params: { page } }),
  getSavedPosts: (page = 1) => api.get('/users/me/saved-posts', { params: { page } }),
  getProfileAnalytics: () => api.get('/users/me/analytics'),
  getTrendingUsers: () => api.get('/users/trending'),
  getSuggestions: () => api.get('/users/suggestions'),
}

export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (data: { member_ids: string[]; name?: string; is_group: boolean }) =>
    api.post('/chat/conversations', data),
  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),
  getMessages: (id: string, page = 1) => api.get(`/chat/conversations/${id}/messages`, { params: { page } }),
  sendMessage: (id: string, data: { content?: string; message_type?: string; media_url?: string; reply_to_id?: string }) =>
    api.post(`/chat/conversations/${id}/messages`, data),
  editMessage: (convId: string, msgId: string, content: string) =>
    api.put(`/chat/conversations/${convId}/messages/${msgId}`, { content }),
  deleteMessage: (convId: string, msgId: string) =>
    api.delete(`/chat/conversations/${convId}/messages/${msgId}`),
  reactToMessage: (convId: string, msgId: string, emoji: string) =>
    api.post(`/chat/conversations/${convId}/messages/${msgId}/react`, { emoji }),
  markRead: (id: string) => api.post(`/chat/conversations/${id}/read`),
  searchMessages: (q: string, conversation_id?: string) =>
    api.get('/chat/conversations/search', { params: { q, conversation_id } }),
}

export const workspaceService = {
  getWorkspaces: () => api.get('/workspaces'),
  createWorkspace: (data: object) => api.post('/workspaces', data),
  getWorkspace: (id: string) => api.get(`/workspaces/${id}`),
  updateWorkspace: (id: string, data: object) => api.put(`/workspaces/${id}`, data),
  deleteWorkspace: (id: string) => api.delete(`/workspaces/${id}`),
  getMembers: (id: string) => api.get(`/workspaces/${id}/members`),
  inviteMember: (id: string, email: string, role: string) => api.post(`/workspaces/${id}/members`, { email, role }),
  updateMemberRole: (wsId: string, userId: string, role: string) => api.put(`/workspaces/${wsId}/members/${userId}`, { role }),
  removeMember: (wsId: string, userId: string) => api.delete(`/workspaces/${wsId}/members/${userId}`),
  generateInvite: (id: string) => api.post(`/workspaces/${id}/invite`),
  joinWorkspace: (token: string) => api.post(`/workspaces/join/${token}`),
}

export const projectService = {
  getProjects: (wsId: string) => api.get(`/projects/workspaces/${wsId}/projects`),
  createProject: (wsId: string, data: object) => api.post(`/projects/workspaces/${wsId}/projects`, data),
  getProject: (wsId: string, id: string) => api.get(`/projects/workspaces/${wsId}/projects/${id}`),
  updateProject: (wsId: string, id: string, data: object) => api.put(`/projects/workspaces/${wsId}/projects/${id}`, data),
  deleteProject: (wsId: string, id: string) => api.delete(`/projects/workspaces/${wsId}/projects/${id}`),
  getBoard: (wsId: string, projId: string) => api.get(`/projects/workspaces/${wsId}/projects/${projId}/board`),
  getTasks: (wsId: string, projId: string) => api.get(`/projects/workspaces/${wsId}/projects/${projId}/tasks`),
  createTask: (wsId: string, projId: string, data: object) => api.post(`/projects/workspaces/${wsId}/projects/${projId}/tasks`, data),
  updateTask: (wsId: string, projId: string, taskId: string, data: object) => api.put(`/projects/workspaces/${wsId}/projects/${projId}/tasks/${taskId}`, data),
  deleteTask: (wsId: string, projId: string, taskId: string) => api.delete(`/projects/workspaces/${wsId}/projects/${projId}/tasks/${taskId}`),
  moveTask: (wsId: string, projId: string, taskId: string, board_column: string, position: number) =>
    api.patch(`/projects/workspaces/${wsId}/projects/${projId}/tasks/${taskId}/move`, { board_column, position }),
  getTaskComments: (wsId: string, projId: string, taskId: string) => api.get(`/projects/workspaces/${wsId}/projects/${projId}/tasks/${taskId}/comments`),
  addTaskComment: (wsId: string, projId: string, taskId: string, content: string) => api.post(`/projects/workspaces/${wsId}/projects/${projId}/tasks/${taskId}/comments`, { content }),
  getActivity: (wsId: string, projId: string) => api.get(`/projects/workspaces/${wsId}/projects/${projId}/activity`),
}

export const notificationService = {
  getNotifications: (page = 1, unread_only = false) => api.get('/notifications', { params: { page, unread_only } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (prefs: object) => api.put('/notifications/preferences', prefs),
}

export const analyticsService = {
  getMyAnalytics: (period = '30d') => api.get('/analytics/me', { params: { period } }),
  getWorkspaceAnalytics: (id: string, period = '30d') => api.get(`/analytics/workspace/${id}`, { params: { period } }),
  getEngagement: () => api.get('/analytics/engagement'),
}

export const adminService = {
  listUsers: (params?: object) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: object) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  suspendUser: (id: string, reason: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => api.post(`/admin/users/${id}/activate`),
  listPosts: (params?: object) => api.get('/admin/posts', { params }),
  removePost: (id: string) => api.delete(`/admin/posts/${id}`),
  getAnalytics: () => api.get('/admin/analytics'),
  getAuditLogs: (params?: object) => api.get('/admin/audit-logs', { params }),
  getReports: () => api.get('/admin/reports'),
  systemHealth: () => api.get('/admin/system/health'),
}

export const fileService = {
  uploadFile: (file: File) => {
    const form = new FormData(); form.append('file', file)
    return api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getFile: (id: string) => api.get(`/files/${id}`),
  deleteFile: (id: string) => api.delete(`/files/${id}`),
  listFiles: (params?: object) => api.get('/files', { params }),
}
