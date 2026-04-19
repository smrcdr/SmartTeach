import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import {
  createGroupChat,
  createMessage,
  createOrGetDirectChat,
  deleteMessage,
  getChat,
  listChats,
  listGroupChats,
  listMessages,
  updateMessage,
  type Chat,
  type ChatMessage,
  type ChatType,
  type CreateGroupChatPayload,
  type CreateMessagePayload,
  type ListChatsQuery,
  type UpdateMessagePayload,
} from '../api/chats.api'
import { applyIncomingChatMessage, chatQueryKeys, invalidateChatLists, setChatDetail } from '../lib/chat-cache'
import { CHAT_MESSAGES_PAGE_SIZE } from '../lib/chats.ui'

const DEFAULT_QUERY = {}

export function useChatsList(
  scope: 'global' | 'group',
  query: MaybeRefOrGetter<Partial<ListChatsQuery>> = DEFAULT_QUERY,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const normalizedQuery = computed(() => normalizeListQuery(toValue(query)))
  const enabled = computed(() => toValue(options.enabled) ?? true)

  return useQuery({
    queryKey: computed(() => chatQueryKeys.list(scope, normalizedQuery.value)),
    queryFn: () => listChats(normalizedQuery.value),
    enabled,
  })
}

export function useGroupChats(
  groupId: MaybeRefOrGetter<string>,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => chatQueryKeys.list('group', { groupId: resolvedGroupId.value, chatType: 'GROUP' })),
    queryFn: () => listGroupChats(resolvedGroupId.value),
    enabled,
  })
}

export function useChat(chatId: MaybeRefOrGetter<string>, options: { enabled?: MaybeRefOrGetter<boolean> } = {}) {
  const resolvedChatId = computed(() => toValue(chatId))
  const enabled = computed(() => Boolean(resolvedChatId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => chatQueryKeys.detail(resolvedChatId.value)),
    queryFn: () => getChat(resolvedChatId.value),
    enabled,
  })
}

export function useChatMessages(
  chatId: MaybeRefOrGetter<string>,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const resolvedChatId = computed(() => toValue(chatId))
  const enabled = computed(() => Boolean(resolvedChatId.value) && (toValue(options.enabled) ?? true))

  return useInfiniteQuery({
    queryKey: computed(() => chatQueryKeys.messages(resolvedChatId.value)),
    queryFn: ({ pageParam }) =>
      listMessages(resolvedChatId.value, {
        limit: CHAT_MESSAGES_PAGE_SIZE,
        ...(pageParam
          ? {
              before: pageParam,
            }
          : {}),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.length === CHAT_MESSAGES_PAGE_SIZE ? firstPage[0]?.createdAt ?? undefined : undefined,
    enabled,
  }) as ReturnType<
    typeof useInfiniteQuery<
      ChatMessage[],
      Error,
      InfiniteData<ChatMessage[], string | null>,
      ReturnType<typeof chatQueryKeys.messages>,
      string | null
    >
  >
}

export function useChatPreviews(
  chatIds: MaybeRefOrGetter<string[]>,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const resolvedChatIds = computed(() => Array.from(new Set(toValue(chatIds).filter(Boolean))))
  const enabled = computed(
    () => resolvedChatIds.value.length > 0 && (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() => chatQueryKeys.previewMap(resolvedChatIds.value)),
    queryFn: async () => {
      const previewEntries = await Promise.all(
        resolvedChatIds.value.map(async (chatId) => {
          const messages = await listMessages(chatId, {
            limit: 1,
          })

          return [chatId, messages[0] ?? null] as const
        }),
      )

      return Object.fromEntries(previewEntries)
    },
    enabled,
  })
}

export function useCreateOrGetDirectChatMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => createOrGetDirectChat({ userId }),
    onSuccess: async (chat: Chat) => {
      setChatDetail(queryClient, chat)
      await invalidateChatLists(queryClient)
    },
  })
}

export function useCreateGroupChatMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGroupChatPayload) => createGroupChat(resolvedGroupId.value, payload),
    onSuccess: async (chat: Chat) => {
      setChatDetail(queryClient, chat)
      await invalidateChatLists(queryClient)
    },
  })
}

export function useCreateMessageMutation(chatId: MaybeRefOrGetter<string>) {
  const resolvedChatId = computed(() => toValue(chatId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateMessagePayload) => createMessage(resolvedChatId.value, payload),
    onSuccess: async (message: ChatMessage) => {
      applyIncomingChatMessage(queryClient, message)
    },
  })
}

export function useUpdateMessageMutation(chatId: MaybeRefOrGetter<string>) {
  const resolvedChatId = computed(() => toValue(chatId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, payload }: { messageId: string; payload: UpdateMessagePayload }) =>
      updateMessage(resolvedChatId.value, messageId, payload),
    onSuccess: async (message: ChatMessage) => {
      applyIncomingChatMessage(queryClient, message)
    },
  })
}

export function useDeleteMessageMutation(chatId: MaybeRefOrGetter<string>) {
  const resolvedChatId = computed(() => toValue(chatId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; currentMessage: ChatMessage }) =>
      deleteMessage(resolvedChatId.value, messageId),
    onSuccess: async (_result, variables) => {
      applyIncomingChatMessage(queryClient, {
        ...variables.currentMessage,
        text: null,
        files: [],
        deletedAt: new Date().toISOString(),
      })
    },
  })
}

function normalizeListQuery(query: Partial<ListChatsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListChatsQuery>
}

export function getChatTypeLabel(chatType: ChatType) {
  return chatType === 'DIRECT' ? 'Личные' : 'Групповые'
}
