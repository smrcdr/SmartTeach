import { io, type Socket } from 'socket.io-client'
import type { Message } from './chats.api'

export type ChatRealtimeClient = Socket<{
  'chat.message.created': (message: Message) => void
  'chat.message.updated': (message: Message) => void
  'chat.message.deleted': (message: Message) => void
}, {
  'chat.subscribe': (
    payload: { chatId: string },
    callback: (response: { ok: true; chatId: string } | { ok: false; error: string }) => void
  ) => void
}>

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api/v1'
const chatRealtimeUrl = import.meta.env.VITE_CHAT_REALTIME_URL ?? getDefaultRealtimeUrl()

function getDefaultRealtimeUrl() {
  if (typeof apiBaseUrl === 'string' && apiBaseUrl.startsWith('http')) {
    return apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
  }

  return typeof window === 'undefined' ? '' : window.location.origin
}

export function createChatRealtimeClient(accessToken: string) {
  return io(`${chatRealtimeUrl}/chat`, {
    auth: {
      token: accessToken
    },
    transports: ['websocket'],
    autoConnect: false
  }) as ChatRealtimeClient
}
