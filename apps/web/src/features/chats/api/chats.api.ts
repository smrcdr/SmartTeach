import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

type RawChat = components['schemas']['Chat']
type RawMessage = components['schemas']['Message']
type ErrorResponse = components['schemas']['ErrorResponse']
type UploadFileBody = paths['/files']['post']['requestBody']['content']['multipart/form-data']
type CreateMessageRequestBody =
  paths['/chats/{chatId}/messages']['post']['requestBody']['content']['application/json']
type UpdateMessageRequestBody =
  paths['/chats/{chatId}/messages/{messageId}']['patch']['requestBody']['content']['application/json']
type CreateDirectChatRequestBody = paths['/chats/direct']['post']['requestBody']['content']['application/json']
type CreateGroupChatRequestBody =
  paths['/groups/{groupId}/chats']['post']['requestBody']['content']['application/json']

export type Chat = Omit<RawChat, 'groupId' | 'title' | 'lastMessageAt'> & {
  groupId: string | null
  title: string | null
  lastMessageAt: string | null
}

export type ChatMessage = Omit<RawMessage, 'text' | 'editedAt' | 'deletedAt'> & {
  text: string | null
  editedAt: string | null
  deletedAt: string | null
}

export type ChatType = Chat['chatType']
export type ChatMember = Chat['members'][number]
export type ChatFile = components['schemas']['FileObject']
export type ChatUser = components['schemas']['PublicUser']
export type ListChatsQuery = NonNullable<paths['/chats']['get']['parameters']['query']>
export type ListMessagesQuery = NonNullable<paths['/chats/{chatId}/messages']['get']['parameters']['query']>
export type CreateMessagePayload = {
  text?: string
  fileIds?: string[]
}
export type UpdateMessagePayload = {
  text?: string
  fileIds?: string[]
}
export type CreateDirectChatPayload = {
  userId: string
}
export type CreateGroupChatPayload = {
  title: string
}

export class ChatsApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'ChatsApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function listChats(query: Partial<ListChatsQuery> = {}) {
  const normalizedQuery = normalizeListChatsQuery(query)
  const { data, error, response } = await apiClient.GET('/chats', {
    params: {
      query: normalizedQuery,
    },
  })

  if (data) {
    return data.map((chat) => normalizeChat(chat as RawChat))
  }

  throw new ChatsApiError(error, response.status, 'Не удалось загрузить список чатов')
}

export async function listGroupChats(groupId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/chats', {
    params: {
      path: {
        groupId,
      },
    },
  })

  if (data) {
    return data.map((chat) => normalizeChat(chat as RawChat))
  }

  throw new ChatsApiError(error, response.status, 'Не удалось загрузить комнаты группы')
}

export async function getChat(chatId: string) {
  const { data, error, response } = await apiClient.GET('/chats/{chatId}', {
    params: {
      path: {
        chatId,
      },
    },
  })

  if (data) {
    return normalizeChat(data as RawChat)
  }

  throw new ChatsApiError(error, response.status, 'Не удалось открыть чат')
}

export async function listMessages(chatId: string, query: Partial<ListMessagesQuery> = {}) {
  const normalizedQuery = normalizeListMessagesQuery(query)
  const { data, error, response } = await apiClient.GET('/chats/{chatId}/messages', {
    params: {
      path: {
        chatId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data.map((message) => normalizeMessage(message as RawMessage))
  }

  throw new ChatsApiError(error, response.status, 'Не удалось загрузить сообщения')
}

export async function createMessage(chatId: string, payload: CreateMessagePayload) {
  const { data, error, response } = await apiClient.POST('/chats/{chatId}/messages', {
    params: {
      path: {
        chatId,
      },
    },
    body: payload as CreateMessageRequestBody,
  })

  if (data) {
    return normalizeMessage(data as RawMessage)
  }

  throw new ChatsApiError(error, response.status, 'Не удалось отправить сообщение')
}

export async function updateMessage(chatId: string, messageId: string, payload: UpdateMessagePayload) {
  const { data, error, response } = await apiClient.PATCH('/chats/{chatId}/messages/{messageId}', {
    params: {
      path: {
        chatId,
        messageId,
      },
    },
    body: payload as UpdateMessageRequestBody,
  })

  if (data) {
    return normalizeMessage(data as RawMessage)
  }

  throw new ChatsApiError(error, response.status, 'Не удалось обновить сообщение')
}

export async function deleteMessage(chatId: string, messageId: string) {
  const { error, response } = await apiClient.DELETE('/chats/{chatId}/messages/{messageId}', {
    params: {
      path: {
        chatId,
        messageId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new ChatsApiError(error, response.status, 'Не удалось удалить сообщение')
}

export async function createOrGetDirectChat(payload: CreateDirectChatPayload) {
  const { data, error, response } = await apiClient.POST('/chats/direct', {
    body: payload as CreateDirectChatRequestBody,
  })

  if (data) {
    return normalizeChat(data as RawChat)
  }

  throw new ChatsApiError(error, response.status, 'Не удалось открыть личный чат')
}

export async function createGroupChat(groupId: string, payload: CreateGroupChatPayload) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/chats', {
    params: {
      path: {
        groupId,
      },
    },
    body: payload as CreateGroupChatRequestBody,
  })

  if (data) {
    return normalizeChat(data as RawChat)
  }

  throw new ChatsApiError(error, response.status, 'Не удалось создать групповой чат')
}

export async function uploadChatFile(file: File) {
  const formData = new FormData()

  formData.set('file', file)
  formData.set('folder', 'messages')

  const { data, error, response } = await apiClient.POST('/files', {
    body: formData as unknown as UploadFileBody,
  })

  if (data) {
    return data
  }

  throw new ChatsApiError(error, response.status, 'Не удалось загрузить файл')
}

export async function uploadChatFiles(files: File[]) {
  if (files.length === 0) {
    return []
  }

  const uploadResults = await Promise.allSettled(files.map((file) => uploadChatFile(file)))
  const uploadedFiles = uploadResults.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  const failedUpload = uploadResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')

  if (!failedUpload) {
    return uploadedFiles
  }

  if (uploadedFiles.length > 0) {
    await Promise.allSettled(uploadedFiles.map((file) => deleteUploadedChatFile(file.id)))
  }

  throw failedUpload.reason
}

export async function deleteUploadedChatFile(fileId: string) {
  const { error, response } = await apiClient.DELETE('/files/{fileId}', {
    params: {
      path: {
        fileId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new ChatsApiError(error, response.status, 'Не удалось удалить временный файл')
}

export function getChatsErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ChatsApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function normalizeChat(chat: RawChat): Chat {
  return {
    ...chat,
    groupId: normalizeNullableString(chat.groupId),
    title: normalizeNullableString(chat.title),
    lastMessageAt: normalizeNullableString(chat.lastMessageAt),
  }
}

function normalizeMessage(message: RawMessage): ChatMessage {
  return {
    ...message,
    text: normalizeNullableString(message.text),
    editedAt: normalizeNullableString(message.editedAt),
    deletedAt: normalizeNullableString(message.deletedAt),
  }
}

function normalizeListChatsQuery(query: Partial<ListChatsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListChatsQuery>
}

function normalizeListMessagesQuery(query: Partial<ListMessagesQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListMessagesQuery>
}

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}
