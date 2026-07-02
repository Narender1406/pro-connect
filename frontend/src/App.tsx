import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './store/hooks'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { initAuth } from './store/slices/authSlice'
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Main pages
import FeedPage from './pages/feed/FeedPage'
import ProfilePage from './pages/profile/ProfilePage'
import EditProfilePage from './pages/profile/EditProfilePage'
import ChatPage from './pages/chat/ChatPage'
import WorkspacePage from './pages/workspace/WorkspacePage'
import ProjectBoardPage from './pages/projects/ProjectBoardPage'
import AdminPage from './pages/admin/AdminPage'
import NotificationsPage from './pages/NotificationsPage'
import ExplorePage from './pages/ExplorePage'
import SettingsPage from './pages/SettingsPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import AIPage from './pages/ai/AIPage'
import SearchPage from './pages/search/SearchPage'
import CalendarPage from './pages/calendar/CalendarPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAppSelector(s => s.auth)
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector(s => s.auth)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  return isAdmin ? <>{children}</> : <Navigate to="/feed" replace />
}

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initAuth() as any)
  }, [])

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/workspaces" element={<WorkspacePage />} />
        <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
        <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectBoardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
