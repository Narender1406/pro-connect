import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { notificationService } from '../../services'
import { setUnreadCount } from '../../store/slices/notificationSlice'
import { toggleMobileSidebar, closeMobileSidebar } from '../../store/slices/uiSlice'

export default function MainLayout() {
  useWebSocket()
  const dispatch = useAppDispatch()
  const { mobileSidebarOpen } = useAppSelector(s => s.ui)

  useEffect(() => {
    notificationService.getUnreadCount()
      .then(r => dispatch(setUnreadCount(r.data.count)))
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-900 overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
