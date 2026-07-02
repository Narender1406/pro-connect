import { NavLink, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { logoutUser } from '../../store/slices/authSlice'
import Avatar from '../ui/Avatar'
import {
  Home, Compass, MessageSquare, Briefcase, Bell, Settings,
  Shield, LogOut, ChevronDown, Plus, TrendingUp, Search,
  BarChart2, Sparkles, Calendar
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/chat', icon: MessageSquare, label: 'Messages', badge: true },
  { to: '/workspaces', icon: Briefcase, label: 'Workspaces' },
  { to: '/notifications', icon: Bell, label: 'Notifications', notif: true },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
]

export default function Sidebar() {
  const { user } = useAppSelector(s => s.auth)
  const { unreadCount } = useAppSelector(s => s.notifications)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-200 dark:border-surface-800 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">CT</span>
        </div>
        <span className="font-bold text-surface-900 dark:text-white text-lg">CareerTrack</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, notif }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}>
            <div className="relative">
              <Icon size={18} />
              {notif && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}>
            <Shield size={18} />
            <span>Admin</span>
          </NavLink>
        )}

        <div className="pt-3 mt-3 border-t border-surface-100 dark:border-surface-800">
          <button onClick={() => navigate('/workspaces')} className="sidebar-item w-full">
            <Plus size={18} />
            <span>New Workspace</span>
          </button>
        </div>
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-surface-200 dark:border-surface-800 flex-shrink-0">
        <div className="relative">
          <button onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <Avatar user={user} size="sm" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-surface-500 truncate">@{user?.username}</p>
            </div>
            <ChevronDown size={16} className="text-surface-400 flex-shrink-0" />
          </button>

          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-0 right-0 mb-1 card shadow-lg py-1 z-50">
                <button onClick={() => { navigate(`/profile/${user?.username}`); setProfileMenuOpen(false) }} className="sidebar-item w-full text-sm">
                  View Profile
                </button>
                <button onClick={() => { navigate('/settings'); setProfileMenuOpen(false) }} className="sidebar-item w-full text-sm">
                  <Settings size={15} /> Settings
                </button>
                <div className="divider my-1" />
                <button onClick={handleLogout} className="sidebar-item w-full text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut size={15} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
