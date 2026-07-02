import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '../../types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
}

const initialState: NotificationState = { notifications: [], unreadCount: 0 }

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.notifications = action.payload
    },
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload)
      state.unreadCount++
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find(n => n.id === action.payload)
      if (n && !n.is_read) { n.is_read = true; state.unreadCount = Math.max(0, state.unreadCount - 1) }
    },
    markAllRead(state) {
      state.notifications.forEach(n => { n.is_read = true })
      state.unreadCount = 0
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
  },
})

export const { setNotifications, addNotification, setUnreadCount, markRead, markAllRead, removeNotification } = notificationSlice.actions
export default notificationSlice.reducer
