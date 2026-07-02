import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Conversation, Message } from '../../types'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  typingUsers: Record<string, string[]>
  onlineUsers: string[]
  unreadCounts: Record<string, number>
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: [],
  unreadCounts: {},
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      const exists = state.conversations.find(c => c.id === action.payload.id)
      if (!exists) state.conversations.unshift(action.payload)
    },
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload
    },
    setMessages(state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) {
      state.messages[action.payload.conversationId] = action.payload.messages
    },
    addMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const { conversationId, message } = action.payload
      if (!state.messages[conversationId]) state.messages[conversationId] = []
      const exists = state.messages[conversationId].find(m => m.id === message.id)
      if (!exists) state.messages[conversationId].push(message)
      // Update conversation last_message_at
      const conv = state.conversations.find(c => c.id === conversationId)
      if (conv) conv.last_message_at = message.created_at
      state.conversations.sort((a, b) =>
        new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
      )
    },
    updateMessage(state, action: PayloadAction<{ conversationId: string; message: Partial<Message> & { id: string } }>) {
      const msgs = state.messages[action.payload.conversationId]
      if (msgs) {
        const idx = msgs.findIndex(m => m.id === action.payload.message.id)
        if (idx !== -1) msgs[idx] = { ...msgs[idx], ...action.payload.message }
      }
    },
    setTyping(state, action: PayloadAction<{ conversationId: string; userId: string; typing: boolean }>) {
      const { conversationId, userId, typing } = action.payload
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = []
      if (typing) {
        if (!state.typingUsers[conversationId].includes(userId))
          state.typingUsers[conversationId].push(userId)
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId)
      }
    },
    setUserOnline(state, action: PayloadAction<string>) {
      if (!state.onlineUsers.includes(action.payload))
        state.onlineUsers.push(action.payload)
    },
    setUserOffline(state, action: PayloadAction<string>) {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload)
    },
    incrementUnread(state, action: PayloadAction<string>) {
      state.unreadCounts[action.payload] = (state.unreadCounts[action.payload] || 0) + 1
    },
    clearUnread(state, action: PayloadAction<string>) {
      const idx = Object.keys(state.unreadCounts).indexOf(action.payload)
      if (idx !== -1) {
        const next = { ...state.unreadCounts }
        delete next[action.payload]
        state.unreadCounts = next
      }
    },
  },
})

export const { setConversations, addConversation, setActiveConversation, setMessages, addMessage, updateMessage, setTyping, setUserOnline, setUserOffline, incrementUnread, clearUnread } = chatSlice.actions
export default chatSlice.reducer
