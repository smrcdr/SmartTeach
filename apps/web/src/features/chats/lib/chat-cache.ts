import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/vue-query'

import type { Chat, ChatMessage, ChatType } from '../api/chats.api'
import { dedupeMessages, sortMessages } from './chats.ui'

type ChatListScope = 'global' | 'group'
type ChatPreviewMap = Record<string, ChatMessage | null>
type ChatMessagesHistory = InfiniteData<ChatMessage[], string | null>

const CHAT_LIST_PREFIX = ['chats', 'list'] as const
const CHAT_PREVIEW_MAP_PREFIX = ['chats', 'preview-maps'] as const

export const chatQueryKeys = {
  all: ['chats'] as const,
  listPrefix: CHAT_LIST_PREFIX,
  list: (
    scope: ChatListScope,
    query: {
      chatType?: ChatType
      groupId?: string
    },
  ) => ['chats', 'list', scope, query] as const,
  detail: (chatId: string) => ['chats', 'detail', chatId] as const,
  messages: (chatId: string) => ['chats', 'messages', chatId] as const,
  previewMaps: CHAT_PREVIEW_MAP_PREFIX,
  previewMap: (chatIds: string[]) => ['chats', 'preview-maps', chatIds] as const,
}

export function applyIncomingChatMessage(queryClient: QueryClient, message: ChatMessage) {
  patchChatListQueries(queryClient, message)
  patchChatDetail(queryClient, message)
  patchChatMessageHistory(queryClient, message)
  patchChatPreviewMaps(queryClient, message)
}

function patchChatListQueries(queryClient: QueryClient, message: ChatMessage) {
  for (const query of queryClient.getQueryCache().findAll({
    queryKey: chatQueryKeys.listPrefix,
  })) {
    queryClient.setQueryData<Chat[]>(query.queryKey, (currentChats) => {
      if (!currentChats) {
        return currentChats
      }

      let didChange = false

      const nextChats = currentChats.map((chat) => {
        if (chat.id !== message.chatId) {
          return chat
        }

        didChange = true

        return {
          ...chat,
          lastMessageAt: shouldReplaceActivity(chat.lastMessageAt, message.createdAt) ? message.createdAt : chat.lastMessageAt,
        }
      })

      return didChange ? sortChats(nextChats) : currentChats
    })
  }
}

function patchChatDetail(queryClient: QueryClient, message: ChatMessage) {
  queryClient.setQueryData<Chat | null>(chatQueryKeys.detail(message.chatId), (currentChat) => {
    if (!currentChat) {
      return currentChat
    }

    return {
      ...currentChat,
      lastMessageAt: shouldReplaceActivity(currentChat.lastMessageAt, message.createdAt)
        ? message.createdAt
        : currentChat.lastMessageAt,
    }
  })
}

function patchChatMessageHistory(queryClient: QueryClient, message: ChatMessage) {
  queryClient.setQueryData<ChatMessagesHistory | undefined>(chatQueryKeys.messages(message.chatId), (currentHistory) => {
    if (!currentHistory) {
      return {
        pageParams: [null],
        pages: [[message]],
      }
    }

    let hasKnownMessage = false

    const nextPages = currentHistory.pages.map((page) =>
      page.map((currentMessage) => {
        if (currentMessage.id !== message.id) {
          return currentMessage
        }

        hasKnownMessage = true
        return message
      }),
    )

    if (!hasKnownMessage) {
      if (nextPages.length === 0) {
        nextPages.push([message])
      } else {
        nextPages[nextPages.length - 1] = sortMessages([...nextPages[nextPages.length - 1], message])
      }
    }

    return {
      ...currentHistory,
      pages: nextPages.map((page) => sortMessages(dedupeMessages(page))),
    }
  })
}

function patchChatPreviewMaps(queryClient: QueryClient, message: ChatMessage) {
  for (const query of queryClient.getQueryCache().findAll({
    queryKey: chatQueryKeys.previewMaps,
  })) {
    queryClient.setQueryData<ChatPreviewMap>(query.queryKey, (currentMap) => {
      if (!currentMap || !(message.chatId in currentMap)) {
        return currentMap
      }

      const currentPreview = currentMap[message.chatId]

      if (!shouldReplacePreview(currentPreview, message)) {
        return currentMap
      }

      return {
        ...currentMap,
        [message.chatId]: message,
      }
    })
  }
}

function sortChats(chats: Chat[]) {
  return [...chats].sort((left, right) => {
    const activityDiff = getActivityTime(right) - getActivityTime(left)

    if (activityDiff !== 0) {
      return activityDiff
    }

    const createdDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()

    if (createdDiff !== 0) {
      return createdDiff
    }

    return right.id.localeCompare(left.id)
  })
}

function getActivityTime(chat: Chat) {
  return new Date(chat.lastMessageAt ?? chat.createdAt).getTime()
}

function shouldReplaceActivity(currentValue: string | null, nextValue: string) {
  if (!currentValue) {
    return true
  }

  return new Date(nextValue).getTime() >= new Date(currentValue).getTime()
}

function shouldReplacePreview(currentMessage: ChatMessage | null, nextMessage: ChatMessage) {
  if (!currentMessage) {
    return true
  }

  if (currentMessage.id === nextMessage.id) {
    return true
  }

  return new Date(nextMessage.createdAt).getTime() >= new Date(currentMessage.createdAt).getTime()
}

export function setChatDetail(queryClient: QueryClient, chat: Chat) {
  queryClient.setQueryData(chatQueryKeys.detail(chat.id), chat)
}

export async function invalidateChatLists(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    queryKey: chatQueryKeys.listPrefix as unknown as QueryKey,
  })
}
