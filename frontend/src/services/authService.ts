import api from './api'
import type { User, AuthTokens } from '../types'

export const authService = {
  register: (data: { email: string; username: string; full_name: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string; totp_code?: string; device_name?: string }) =>
    api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/login', data),

  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),

  refreshToken: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),

  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),

  setup2FA: () => api.post<{ secret: string; otpauth_url: string }>('/auth/2fa/setup'),

  verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),

  disable2FA: (code: string) => api.post('/auth/2fa/disable', { code }),

  getSessions: () => api.get('/auth/sessions'),

  revokeSession: (id: string) => api.delete(`/auth/sessions/${id}`),

  getMe: () => api.get<{ user: User }>('/auth/me'),

  changePassword: (current_password: string, new_password: string) =>
    api.put('/auth/change-password', { current_password, new_password }),
}
