import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../../services'
import type { Notification } from '../../types'
import Avatar from '../ui/Avatar'
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { formatRelative } from '../../utils'
import { useAppDispatch } from '../../store/hooks'
import { markRead, markAllRead, removeNotification } from '../../store/slices/notificationSlice'

export default function NotificationList() {
  const dispatch = useAppDispatch()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(1, false).then(r => r.data.notifications as Notification[]),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: (_, id) => {
      dispatch(markRead(id))
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      dispatch(markAllRead())
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: (_, id) => {
      dispatch(removeNotification(id))
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={24} className="animate-spin text-primary-500" />
    </div>
  )

  const unread = data?.filter(n => !n.is_read).length || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{unread} unread</p>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {!data?.length ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto text-surface-300 mb-3" />
          <p className="text-surface-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {data.map(n => (
            <div key={n.id}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
              className={`flex items-start gap-3 p-4 rounded-xl transition-colors cursor-pointer group ${
                !n.is_read ? 'bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-950/50' : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
              }`}>
              <div className="relative flex-shrink-0">
                {n.actor ? (
                  <Avatar src={n.actor.avatar_url} name={n.actor.full_name} size="sm" />
                ) : (
                  <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <Bell size={16} className="text-primary-600" />
                  </div>
                )}
                {!n.is_read && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-500 rounded-full ring-2 ring-white dark:ring-surface-900" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.is_read ? 'font-semibold text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-surface-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-surface-400 mt-1">{formatRelative(n.created_at)}</p>
              </div>

              <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-surface-400 hover:text-red-500 rounded-lg transition-all flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
