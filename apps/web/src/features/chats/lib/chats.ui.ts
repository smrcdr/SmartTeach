import type { Chat, ChatFile, ChatMessage, ChatUser } from '../api/chats.api'

export const CHAT_MESSAGES_PAGE_SIZE = 50

export function getChatCounterpart(chat: Chat, currentUserId: string) {
  if (chat.chatType !== 'DIRECT') {
    return null
  }

  return chat.members.find((member) => member.userId !== currentUserId)?.user ?? null
}

export function getChatTitle(chat: Chat, currentUserId: string) {
  if (chat.chatType === 'GROUP') {
    return normalizeOptionalText(chat.title) || 'Групповой чат'
  }

  return getChatCounterpart(chat, currentUserId)?.displayName ?? 'Личный чат'
}

export function getChatDescription(chat: Chat, currentUserId: string) {
  if (chat.chatType === 'GROUP') {
    return `Участников: ${chat.members.length}`
  }

  return normalizeOptionalText(getChatCounterpart(chat, currentUserId)?.bio) || 'Личный диалог 1 на 1'
}

export function getChatPreview(message: ChatMessage | null) {
  if (!message) {
    return 'Сообщений пока нет'
  }

  if (message.deletedAt) {
    return 'Сообщение удалено'
  }

  if (normalizeOptionalText(message.text)) {
    return normalizeOptionalText(message.text)
  }

  if (message.files.length === 1) {
    return `Файл: ${message.files[0].originalName}`
  }

  if (message.files.length > 1) {
    return `Вложения: ${message.files.length}`
  }

  return 'Сообщений пока нет'
}

export function getChatAvatarLabel(chat: Chat, currentUserId: string) {
  if (chat.chatType === 'GROUP') {
    return getInitials(normalizeOptionalText(chat.title) || 'ГЧ')
  }

  return getInitials(getChatCounterpart(chat, currentUserId)?.displayName ?? 'ЛЧ')
}

export function getChatAvatarImage(chat: Chat, currentUserId: string) {
  return normalizeNullableString(getChatCounterpart(chat, currentUserId)?.avatarUrl)
}

export function getInitials(value: string) {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return 'ST'
  }

  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')

  return initials || normalized.slice(0, 2).toUpperCase()
}

export function formatChatActivity(value: string | null) {
  if (!value) {
    return 'Без активности'
  }

  const date = new Date(value)
  const now = new Date()
  const isSameDay = date.toDateString() === now.toDateString()

  return new Intl.DateTimeFormat('ru-RU', {
    day: isSameDay ? undefined : 'numeric',
    month: isSameDay ? undefined : 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} Б`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} КБ`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} МБ`
}

export function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

export function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((left, right) => {
    const timeDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()

    if (timeDiff !== 0) {
      return timeDiff
    }

    return left.id.localeCompare(right.id)
  })
}

export function dedupeMessages(messages: ChatMessage[]) {
  return Array.from(new Map(messages.map((message) => [message.id, message])).values())
}

export function canDeleteMessage(message: ChatMessage, currentUserId: string, canModerateGroup: boolean) {
  if (message.deletedAt) {
    return false
  }

  return message.authorId === currentUserId || canModerateGroup
}

export function canEditMessage(message: ChatMessage, currentUserId: string) {
  return message.authorId === currentUserId && !message.deletedAt
}

export function getMessageAuthorLabel(message: ChatMessage, currentUserId: string) {
  return message.authorId === currentUserId ? 'Вы' : message.author.displayName
}

export function buildMessagePlaceholder(message: ChatMessage) {
  return message.deletedAt ? 'Сообщение удалено' : ''
}

export function formatAttachmentSummary(files: ChatFile[]) {
  if (files.length === 0) {
    return ''
  }

  if (files.length === 1) {
    return files[0].originalName
  }

  return `${files.length} файлов`
}

export function getUserIdentity(user: ChatUser | null) {
  return {
    initials: getInitials(user?.displayName ?? ''),
    avatarUrl: normalizeNullableString(user?.avatarUrl),
    bio: normalizeOptionalText(user?.bio),
  }
}
