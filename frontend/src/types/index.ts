export interface User {
  id: string
  email: string
  username: string
  full_name: string
  role: 'user' | 'moderator' | 'admin' | 'super_admin'
  status: 'active' | 'suspended' | 'deactivated' | 'pending_verification'
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  headline: string | null
  location: string | null
  website: string | null
  github_username: string | null
  linkedin_url: string | null
  resume_url: string | null
  open_to_work: boolean
  email_verified: boolean
  two_factor_enabled: boolean
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  last_seen_at: string | null
}

export interface UserProfile extends User {
  skills: Skill[]
  experience: Experience[]
  education: Education[]
  portfolio_links: PortfolioLink[]
  profile_views: number
  is_following: boolean
}

export interface Skill {
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years?: number
  endorsed_by: string[]
}

export interface Experience {
  id: string
  company: string
  title: string
  location?: string
  start_date: string
  end_date?: string
  current: boolean
  description?: string
  skills_used: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  start_year: number
  end_year?: number
  gpa?: number
  activities?: string
}

export interface PortfolioLink {
  title: string
  url: string
  description?: string
}

export interface Post {
  id: string
  content: string
  post_type: 'text' | 'image' | 'video' | 'article' | 'job_post' | 'poll'
  media_urls: string[]
  hashtags: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  saves_count: number
  visibility: 'public' | 'connections' | 'private'
  is_pinned: boolean
  liked: boolean
  saved: boolean
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    headline: string | null
  }
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  content: string
  post_id: string
  parent_id: string | null
  likes_count: number
  replies_count: number
  author: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  }
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  content: string | null
  message_type: 'text' | 'image' | 'file' | 'audio' | 'system'
  media_url: string | null
  reply_to_id: string | null
  is_edited: boolean
  is_deleted: boolean
  read_by: string[]
  reactions: Array<{ user_id: string; emoji: string }>
  sender: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  }
  created_at: string
}

export interface Conversation {
  id: string
  name: string | null
  is_group: boolean
  avatar_url: string | null
  last_message_at: string | null
  member_count: number
  members?: Array<{
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    role: string
  }>
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website: string | null
  industry: string | null
  size: string | null
  members_count: number
  role: string
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  status: 'active' | 'archived' | 'completed'
  due_date: string | null
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  board_column: 'todo' | 'in_progress' | 'in_review' | 'done'
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  labels: string[]
  due_date: string | null
  position: number
  estimated_hours: number | null
  logged_hours: number | null
  assignee: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  } | null
  created_at: string
}

export interface KanbanBoard {
  todo: Task[]
  in_progress: Task[]
  in_review: Task[]
  done: Task[]
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  entity_id: string | null
  entity_type: string | null
  is_read: boolean
  actor: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
  } | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  total?: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskColumn = 'todo' | 'in_progress' | 'in_review' | 'done'
