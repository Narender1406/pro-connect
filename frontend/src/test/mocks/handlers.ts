import { http, HttpResponse } from 'msw'

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  role: 'user',
  status: 'active',
  avatar_url: null,
  cover_url: null,
  bio: null,
  headline: 'Software Engineer',
  location: null,
  website: null,
  github_username: null,
  linkedin_url: null,
  resume_url: null,
  open_to_work: false,
  email_verified: true,
  two_factor_enabled: false,
  followers_count: 0,
  following_count: 0,
  posts_count: 0,
  created_at: new Date().toISOString(),
  last_seen_at: null,
}

export const handlers = [
  // Auth
  http.post('/api/v1/auth/login', () =>
    HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expires_in: 900,
      user: mockUser,
    })
  ),

  http.post('/api/v1/auth/register', () =>
    HttpResponse.json({ message: 'Registration successful. Please verify your email.', user: mockUser })
  ),

  http.get('/api/v1/auth/me', () =>
    HttpResponse.json({ user: mockUser })
  ),

  http.post('/api/v1/auth/logout', () =>
    HttpResponse.json({ message: 'Logged out successfully' })
  ),

  // Posts
  http.get('/api/v1/posts', () =>
    HttpResponse.json({ posts: [], page: 1 })
  ),

  // Users
  http.get('/api/v1/users/suggestions', () =>
    HttpResponse.json({ suggestions: [] })
  ),

  http.get('/api/v1/users/trending', () =>
    HttpResponse.json({ users: [] })
  ),

  // Notifications
  http.get('/api/v1/notifications/unread-count', () =>
    HttpResponse.json({ count: 0 })
  ),

  // Analytics
  http.get('/api/v1/analytics/me', () =>
    HttpResponse.json({
      analytics: { profile_views: 0, post_likes: 0, new_followers: 0, posts_published: 0 }
    })
  ),
]
