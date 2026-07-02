import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, Sun, Moon, Bell } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { toggleDarkMode, toggleMobileSidebar } from '../../store/slices/uiSlice'

export default function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { darkMode } = useAppSelector(s => s.ui)
  const { unreadCount } = useAppSelector(s => s.notifications)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header className="h-14 flex items-center gap-4 px-4 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex-shrink-0 z-10">
      <button
        onClick={() => dispatch(toggleMobileSidebar())}
        className="btn-ghost p-2 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            className="input pl-9 py-1.5 h-9 text-sm bg-surface-100 dark:bg-surface-800 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-surface-700"
            placeholder="Search people, posts, skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="btn-ghost p-2 rounded-lg"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="btn-ghost p-2 rounded-lg relative"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  )
}
