import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { chatService } from '../../services'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setConversations, setActiveConversation } from '../../store/slices/chatSlice'
import ConversationList from '../../components/chat/ConversationList'
import MessageArea from '../../components/chat/MessageArea'
import NewConversationModal from '../../components/chat/NewConversationModal'
import type { Conversation } from '../../types'
import { MessageSquarePlus } from 'lucide-react'

export default function ChatPage() {
  const { conversationId } = useParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { conversations } = useAppSelector(s => s.chat)
  const [newConvOpen, setNewConvOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations().then(r => r.data.conversations as Conversation[]),
  })

  useEffect(() => {
    if (data) dispatch(setConversations(data))
  }, [data, dispatch])

  useEffect(() => {
    dispatch(setActiveConversation(conversationId || null))
  }, [conversationId, dispatch])

  const handleSelectConversation = (id: string) => navigate(`/chat/${id}`)

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversation list */}
      <div className={`w-80 flex-shrink-0 border-r border-surface-200 dark:border-surface-800 flex flex-col ${conversationId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
          <h2 className="font-semibold text-surface-900 dark:text-white">Messages</h2>
          <button onClick={() => setNewConvOpen(true)} className="btn-ghost p-2 rounded-lg" title="New conversation">
            <MessageSquarePlus size={18} />
          </button>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={conversationId}
          loading={isLoading}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Message area */}
      <div className={`flex-1 ${!conversationId ? 'hidden lg:flex' : 'flex'} flex-col`}>
        {conversationId ? (
          <MessageArea conversationId={conversationId} onBack={() => navigate('/chat')} />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
              <MessageSquarePlus size={28} className="text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white mb-1">Your Messages</h3>
              <p className="text-sm text-surface-500">Select a conversation or start a new one</p>
            </div>
            <button onClick={() => setNewConvOpen(true)} className="btn-primary">New Message</button>
          </div>
        )}
      </div>

      <NewConversationModal open={newConvOpen} onClose={() => setNewConvOpen(false)} onCreated={handleSelectConversation} />
    </div>
  )
}
