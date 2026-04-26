import type { PublicUser } from '@/features/groups/api/groups.api'
import { apiRequest } from '@/shared/api/http'

export type ChatMember = {
  userId: string
  joinedAt: string
  lastReadAt: string | null
  createdAt: string
  updatedAt: string
  user: PublicUser
}

export type Chat = {
  id: string
  chatType: 'GROUP' | 'DIRECT'
  groupId: string | null
  title: string | null
  createdByUserId: string
  lastMessageAt: string | null
  members: ChatMember[]
  createdAt: string
  updatedAt: string
}

export type Message = {
  id: string
  chatId: string
  authorId: string
  text: string | null
  files: unknown[]
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  author: PublicUser
}

export type ListChatsQuery = {
  chatType?: Chat['chatType']
  groupId?: string
}

function toQuery(query: ListChatsQuery = {}) {
  const params = new URLSearchParams()

  if (query.chatType) {
    params.set('chatType', query.chatType)
  }

  if (query.groupId) {
    params.set('groupId', query.groupId)
  }

  const value = params.toString()
  return value ? `?${value}` : ''
}

export function listChats(query?: ListChatsQuery, token?: string | null) {
  return apiRequest<Chat[]>(`/chats${toQuery(query)}`, { token })
}

export function listGroupChats(groupId: string, token?: string | null) {
  return apiRequest<Chat[]>(`/groups/${groupId}/chats`, { token })
}

export function listMessages(chatId: string, token?: string | null) {
  return apiRequest<Message[]>(`/chats/${chatId}/messages`, { token })
}

export function createMessage(chatId: string, payload: { text: string }, token?: string | null) {
  return apiRequest<Message>(`/chats/${chatId}/messages`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload)
  })
}
