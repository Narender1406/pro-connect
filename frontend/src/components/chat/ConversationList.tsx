import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import Avatar from '../ui/Avatar'
import type { Conversation } from '../../types'

interface Props {
  conversations: Conversation[]
  activeId?: string
  loading: boolean
  onSelect: (id: string) => void
}

export default function ConversationList({ conversations, activeId, loading, onSelect }: Props) {
  const { user } = useAppSelector(s => s.auth)
  const { unreadCounts } = useAppSelector(s => s.chat)

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-surface-400" />
    </div>
  )

  if (!conversations.length) return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <p className="text-sm text-surface-400">No conversations yet</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => {
        const isActive = conv.id === activeId
        const unread = unreadCounts[conv.id] || 0
        const displayName = conv.is_group ? conv.name : conv.name || 'Direct Message'

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-left border-b border-surface-100 dark:border-surface-800/50 ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-semibold text-sm">
                {displayName?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-white'}`}>
                  {displayName}
                </p>
                {conv.last_message_at && (
                  <span className="text-xs text-surface-400 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-surface-400 truncate">{conv.member_count} member{conv.member_count !== 1 ? 's' : ''}</p>
                {unread > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
