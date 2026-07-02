import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../services'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setNotifications, markRead, markAllRead, removeNotification } from '../store/slices/notificationSlice'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '../components/ui/Avatar'
import type { Notification } from '../types'
import { useEffect } from 'react'

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const { notifications } = useAppSelector(s => s.notifications)
  const queryClient = useQueryClient()

  const { isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const r = await notificationService.getNotifications()
      dispatch(setNotifications(r.data.notifications))
      return r.data.notifications
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onMutate: (id) => dispatch(markRead(id)),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: () => dispatch(markAllRead()),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onMutate: (id) => dispatch(removeNotification(id)),
  })

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = { follow: '👤', like: '❤️', comment: '💬', reply: '↩️', mention: '@', message: '📨', task_assigned: '📋', workspace_invite: '🏢', post_share: '🔄', system_alert: '⚠️' }
    return icons[type] || '🔔'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
          <Bell size={20} /> Notifications
        </h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={() => markAllMutation.mutate()} className="btn-ghost text-sm flex items-center gap-1">
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell size={32} className="text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div key={notif.id}
              className={`card p-4 flex items-start gap-3 transition-colors ${!notif.is_read ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30' : ''}`}
              onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
            >
              <div className="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-lg flex-shrink-0">
                {notif.actor ? <Avatar user={notif.actor} size="sm" /> : <span>{getNotifIcon(notif.type)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notif.is_read ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">{notif.body}</p>
                <p className="text-xs text-surface-400 mt-1">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id) }} className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} className="text-surface-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
