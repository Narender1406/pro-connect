import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, ArrowLeft, Loader2, Paperclip, Smile, MoreVertical, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { chatService } from '../../services'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setMessages, addMessage, clearUnread } from '../../store/slices/chatSlice'
import { useWebSocket } from '../../hooks/useWebSocket'
import Avatar from '../ui/Avatar'
import type { Conversation, Message } from '../../types'

interface Props {
  conversationId: string
  onBack: () => void
}

export default function MessageArea({ conversationId, onBack }: Props) {
  const { user } = useAppSelector(s => s.auth)
  const { messages: allMessages, typingUsers } = useAppSelector(s => s.chat)
  const dispatch = useAppDispatch()
  const { sendTyping, joinConversation } = useWebSocket()
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const queryClient = useQueryClient()

  const messages = allMessages[conversationId] || []
  const typing = typingUsers[conversationId]?.filter(id => id !== user?.id) || []

  const { data: conv } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatService.getConversation(conversationId).then(r => r.data.conversation as Conversation),
  })

  const { isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const r = await chatService.getMessages(conversationId)
      const msgs = (r.data.messages as Message[]).reverse()
      dispatch(setMessages({ conversationId, messages: msgs }))
      return msgs
    },
  })

  useEffect(() => {
    joinConversation(conversationId)
    chatService.markRead(conversationId).catch(() => {})
    dispatch(clearUnread(conversationId))
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(conversationId, { content }),
    onSuccess: (r) => {
      dispatch(addMessage({ conversationId, message: r.data.message }))
    },
  })

  const handleSend = () => {
    if (!text.trim()) return
    sendMutation.mutate(text.trim())
    setText('')
    stopTyping()
  }

  const handleTyping = (value: string) => {
    setText(value)
    if (!isTyping) { setIsTyping(true); sendTyping(conversationId, true) }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(stopTyping, 2000)
  }

  const stopTyping = () => {
    setIsTyping(false)
    sendTyping(conversationId, false)
    clearTimeout(typingTimeoutRef.current)
  }

  const convName = conv?.is_group ? conv.name : conv?.members?.find(m => m.id !== user?.id)?.full_name || 'Chat'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex-shrink-0">
        <button onClick={onBack} className="btn-ghost p-2 lg:hidden"><ArrowLeft size={18} /></button>
        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-semibold text-sm flex-shrink-0">
          {convName?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-surface-900 dark:text-white text-sm truncate">{convName}</p>
          {conv?.member_count && <p className="text-xs text-surface-500">{conv.member_count} members</p>}
        </div>
        <button className="btn-ghost p-2"><MoreVertical size={18} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-surface-400" /></div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.sender.id === user?.id
              const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.sender.id !== msg.sender.id)
              const isRead = msg.read_by.length > 1

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <div className="w-7 flex-shrink-0">
                      {showAvatar && <Avatar user={msg.sender} size="xs" />}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs text-surface-400 ml-1 mb-1">{msg.sender.full_name}</span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      msg.is_deleted
                        ? 'bg-surface-100 dark:bg-surface-800 text-surface-400 italic'
                        : isOwn
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-bl-sm'
                    }`}>
                      {msg.is_deleted ? 'Message deleted' : msg.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-surface-400">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                      {isOwn && (isRead ? <CheckCheck size={12} className="text-primary-400" /> : <Check size={12} className="text-surface-400" />)}
                      {msg.is_edited && <span className="text-[10px] text-surface-400">edited</span>}
                    </div>
                    {msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc }, {} as Record<string, number>)).map(([emoji, count]) => (
                          <span key={emoji} className="badge-gray text-xs px-1.5 py-0.5">{emoji} {count}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {typing.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-surface-400">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
                <span>typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex-shrink-0">
        <div className="flex items-end gap-2">
          <button className="btn-ghost p-2 text-surface-400 flex-shrink-0"><Paperclip size={18} /></button>
          <div className="flex-1 relative">
            <textarea
              className="input resize-none pr-10 max-h-32 text-sm py-2"
              placeholder="Type a message..."
              rows={1}
              value={text}
              onChange={e => { handleTyping(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="btn-primary p-2 flex-shrink-0"
          >
            {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
