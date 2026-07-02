import { useEffect, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addMessage, updateMessage, setTyping, setUserOnline, setUserOffline } from '../store/slices/chatSlice'
import { addNotification } from '../store/slices/notificationSlice'
import type { Message } from '../types'

type WsPayload =
  | { event: 'NewMessage'; data: Message & { conversation_id: string } }
  | { event: 'MessageEdited'; data: Partial<Message> & { id: string; conversation_id: string } }
  | { event: 'MessageDeleted'; data: { id: string; conversation_id: string } }
  | { event: 'TypingStart'; data: { conversation_id: string; user_id: string } }
  | { event: 'TypingStop'; data: { conversation_id: string; user_id: string } }
  | { event: 'UserOnline'; data: { user_id: string } }
  | { event: 'UserOffline'; data: { user_id: string } }
  | { event: 'Notification'; data: any }

export function useWebSocket() {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector(s => s.auth)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectDelay = useRef(1000)

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token || !isAuthenticated) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => { reconnectDelay.current = 1000 }

    ws.onmessage = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as WsPayload
        switch (payload.event) {
          case 'NewMessage':
            dispatch(addMessage({ conversationId: payload.data.conversation_id, message: payload.data }))
            break
          case 'MessageEdited':
            dispatch(updateMessage({ conversationId: payload.data.conversation_id, message: payload.data }))
            break
          case 'MessageDeleted':
            dispatch(updateMessage({ conversationId: payload.data.conversation_id, message: { id: payload.data.id, is_deleted: true, content: null } as any }))
            break
          case 'TypingStart':
            dispatch(setTyping({ conversationId: payload.data.conversation_id, userId: payload.data.user_id, typing: true }))
            break
          case 'TypingStop':
            dispatch(setTyping({ conversationId: payload.data.conversation_id, userId: payload.data.user_id, typing: false }))
            break
          case 'UserOnline':
            dispatch(setUserOnline(payload.data.user_id))
            break
          case 'UserOffline':
            dispatch(setUserOffline(payload.data.user_id))
            break
          case 'Notification':
            dispatch(addNotification(payload.data))
            break
        }
      } catch { /* ignore parse errors */ }
    }

    ws.onclose = () => {
      wsRef.current = null
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000)
        connect()
      }, reconnectDelay.current)
    }

    ws.onerror = () => ws.close()
  }, [isAuthenticated, dispatch])

  useEffect(() => {
    if (isAuthenticated) connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [isAuthenticated, connect])

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const sendTyping = useCallback((conversationId: string, typing: boolean) => {
    send({ type: typing ? 'typing_start' : 'typing_stop', conversation_id: conversationId })
  }, [send])

  const joinConversation = useCallback((conversationId: string) => {
    send({ type: 'join_conversation', conversation_id: conversationId })
  }, [send])

  return { send, sendTyping, joinConversation }
}
