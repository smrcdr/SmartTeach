import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { io } from 'socket.io-client'

import { getApiBaseUrl } from '../../../shared/api/client/http'
import { useAuth } from '../../auth/composables/useAuth'
import type { ChatMessage } from '../api/chats.api'
import { applyIncomingChatMessage } from '../lib/chat-cache'

type RealtimeStatus = 'idle' | 'connecting' | 'ready' | 'error'
type ChatSubscribeResponse =
  | {
      ok: true
      chatId: string
    }
  | {
      ok: false
      error: string
    }

export function useActiveChatRealtime(
  chatId: MaybeRefOrGetter<string>,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const queryClient = useQueryClient()
  const { accessToken } = useAuth()
  const resolvedChatId = computed(() => toValue(chatId))
  const enabled = computed(() => Boolean(resolvedChatId.value) && (toValue(options.enabled) ?? true))
  const status = ref<RealtimeStatus>('idle')
  const errorMessage = ref('')

  watch(
    [resolvedChatId, enabled, accessToken],
    ([nextChatId, isEnabled, token], _previousValue, onCleanup) => {
      errorMessage.value = ''

      if (!isEnabled || !nextChatId || !token) {
        status.value = 'idle'
        return
      }

      status.value = 'connecting'

      const socket = io(buildChatSocketUrl(), {
        auth: {
          token,
        },
        withCredentials: true,
        transports: ['websocket'],
      })

      socket.on('connect', () => {
        socket.emit('chat.subscribe', { chatId: nextChatId }, (response: ChatSubscribeResponse) => {
          if (response.ok) {
            status.value = 'ready'
            errorMessage.value = ''
            return
          }

          status.value = 'error'
          errorMessage.value = response.error || 'Не удалось подписаться на события чата'
        })
      })

      socket.on('connect_error', (error: Error) => {
        status.value = 'error'
        errorMessage.value = error.message || 'Realtime соединение не установлено'
      })

      socket.on('disconnect', (reason) => {
        if (reason === 'io client disconnect') {
          status.value = 'idle'
          return
        }

        status.value = 'error'
        errorMessage.value = 'Realtime соединение прервано. Новые сообщения могут потребовать обновления списка.'
      })

      socket.on('chat.message.created', (message: ChatMessage) => {
        applyIncomingChatMessage(queryClient, message)
      })

      socket.on('chat.message.updated', (message: ChatMessage) => {
        applyIncomingChatMessage(queryClient, message, {
          historyMode: 'replace-existing',
        })
      })

      socket.on('chat.message.deleted', (message: ChatMessage) => {
        applyIncomingChatMessage(queryClient, message, {
          historyMode: 'replace-existing',
        })
      })

      onCleanup(() => {
        socket.disconnect()
      })
    },
    {
      immediate: true,
    },
  )

  return {
    status,
    errorMessage,
    isConnected: computed(() => status.value === 'ready'),
  }
}

function buildChatSocketUrl() {
  const apiBaseUrl = new URL(getApiBaseUrl(), window.location.origin)

  return new URL('/chat', apiBaseUrl.origin).toString()
}
