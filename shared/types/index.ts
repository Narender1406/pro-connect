// Shared type definitions between frontend and backend (documentation/reference)
// These mirror the Rust models in backend/src/models/mod.rs

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'pending_verification'
export type PostType = 'text' | 'image' | 'video' | 'article' | 'job_post' | 'poll'
export type PostVisibility = 'public' | 'connections' | 'private'
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system'
export type ProjectStatus = 'active' | 'archived' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskColumn = 'todo' | 'in_progress' | 'in_review' | 'done'
export type NotificationType =
  | 'follow' | 'like' | 'comment' | 'reply' | 'mention' | 'message'
  | 'task_assigned' | 'task_due' | 'workspace_invite' | 'post_share'
  | 'connection_request' | 'job_match' | 'system_alert'

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  total?: number
  has_more?: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

// API endpoint paths (for documentation)
export const API_ENDPOINTS = {
  auth: {
    register: 'POST /auth/register',
    login: 'POST /auth/login',
    logout: 'POST /auth/logout',
    refresh: 'POST /auth/refresh',
    me: 'GET /auth/me',
    verifyEmail: 'GET /auth/verify-email/:token',
    forgotPassword: 'POST /auth/forgot-password',
    resetPassword: 'POST /auth/reset-password',
    setup2fa: 'POST /auth/2fa/setup',
    verify2fa: 'POST /auth/2fa/verify',
    disable2fa: 'POST /auth/2fa/disable',
    sessions: 'GET /auth/sessions',
    revokeSession: 'DELETE /auth/sessions/:id',
    changePassword: 'PUT /auth/change-password',
  },
  users: {
    search: 'GET /users',
    profile: 'GET /users/:id',
    updateProfile: 'PUT /users/me/profile',
    uploadAvatar: 'POST /users/me/avatar',
    follow: 'POST /users/:id/follow',
    unfollow: 'DELETE /users/:id/unfollow',
    suggestions: 'GET /users/suggestions',
  },
  posts: {
    feed: 'GET /posts',
    create: 'POST /posts',
    get: 'GET /posts/:id',
    update: 'PUT /posts/:id',
    delete: 'DELETE /posts/:id',
    like: 'POST /posts/:id/like',
    comments: 'GET /posts/:id/comments',
    addComment: 'POST /posts/:id/comments',
    trending: 'GET /posts/trending',
  },
  chat: {
    conversations: 'GET /chat/conversations',
    createConversation: 'POST /chat/conversations',
    messages: 'GET /chat/conversations/:id/messages',
    sendMessage: 'POST /chat/conversations/:id/messages',
  },
  search: {
    global: 'GET /search',
    users: 'GET /search/users',
    posts: 'GET /search/posts',
    jobs: 'GET /search/jobs',
  },
  ai: {
    chat: 'POST /ai/chat',
    writePost: 'POST /ai/write-post',
    reviewResume: 'POST /ai/resume-review',
    meetingSummary: 'POST /ai/meeting-summary',
    suggestTasks: 'POST /ai/suggest-tasks',
    smartSearch: 'GET /ai/search',
  },
  calendar: {
    events: 'GET /calendar/events',
    createEvent: 'POST /calendar/events',
    rsvp: 'POST /calendar/events/:id/rsvp',
    upcoming: 'GET /calendar/upcoming',
  },
  groups: {
    list: 'GET /groups',
    create: 'POST /groups',
    get: 'GET /groups/:id',
    join: 'POST /groups/:id/join',
    leave: 'POST /groups/:id/leave',
    members: 'GET /groups/:id/members',
    posts: 'GET /groups/:id/posts',
  },
} as const
