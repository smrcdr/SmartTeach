<script setup lang="ts">
import {
  CheckCheck,
  FileText,
  GraduationCap,
  MoreVertical,
  PlusCircle,
  Reply,
  Search,
  Send,
  Users,
  X
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createMessage, listChats, listMessages } from '@/features/chats/api/chats.api'
import type { Chat, Message } from '@/features/chats/api/chats.api'
import { createChatRealtimeClient, type ChatRealtimeClient } from '@/features/chats/api/chats.realtime'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { uploadFile } from '@/shared/api/files.api'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import EmptyState from '@/shared/ui/EmptyState.vue'

type ChatFilterKey = 'ALL' | 'GROUP' | 'DIRECT'

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const chats = ref<Chat[]>([])
const messages = ref<Message[]>([])
const activeChatId = ref<string | null>(null)
const composerText = ref('')
const selectedFiles = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const replyTarget = ref<Message | null>(null)
const isSending = ref(false)
const error = ref<string | null>(null)
const realtimeClient = ref<ChatRealtimeClient | null>(null)
const highlightedMessageId = ref<string | null>(null)
const activeFilter = ref<ChatFilterKey>('ALL')
const messageElements = new Map<string, Element>()
let highlightTimer: ReturnType<typeof setTimeout> | null = null
const filterItems: Array<{ key: ChatFilterKey; label: string }> = [
  { key: 'ALL', label: 'Все' },
  { key: 'GROUP', label: 'Группы' },
  { key: 'DIRECT', label: 'Личные' }
]

const activeChat = computed(() => chats.value.find((chat) => chat.id === activeChatId.value) ?? null)
const activeChatQuery = computed(() => {
  const query: { chatType?: 'GROUP' | 'DIRECT'; groupId?: string } = {}

  if (activeFilter.value !== 'ALL') {
    query.chatType = activeFilter.value
  }

  if (typeof route.query.groupId === 'string') {
    query.groupId = route.query.groupId
  }

  return Object.keys(query).length > 0 ? query : undefined
})

function formatTime(value: string | null) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function getOtherMember(chat: Chat) {
  return chat.members.find((member) => member.userId !== auth.user?.id)?.user ?? chat.members[0]?.user
}

function getChatTitle(chat: Chat) {
  if (chat.title) {
    return chat.title
  }

  if (chat.chatType === 'DIRECT') {
    return getOtherMember(chat)?.displayName ?? 'Личный чат'
  }

  return 'Групповой чат'
}

function getChatAvatarUrl(chat: Chat) {
  if (chat.chatType !== 'DIRECT') {
    return null
  }

  return getOtherMember(chat)?.avatarUrl ?? null
}

function getChatPreview(chat: Chat) {
  if (chat.lastMessageAt) {
    return `Последнее сообщение ${formatTime(chat.lastMessageAt)}`
  }

  return 'Сообщений пока нет'
}

function getRequestedChatId() {
  return typeof route.query.chatId === 'string' ? route.query.chatId : null
}

function pickFiles() {
  fileInput.value?.click()
}

function selectFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])

  if (files.length > 0) {
    selectedFiles.value = [...selectedFiles.value, ...files]
  }

  input.value = ''
}

function removeSelectedFile(index: number) {
  selectedFiles.value = selectedFiles.value.filter((_, fileIndex) => fileIndex !== index)
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} Б`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} КБ`
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} МБ`
}

function getReplyPreviewText(message: Message['replyToMessage']) {
  if (!message) {
    return ''
  }

  if (message.deletedAt) {
    return 'Сообщение удалено'
  }

  return message.text ?? 'Вложение'
}

function getReplySnippetText(message: Message | Message['replyToMessage'], maxLength = 84) {
  if (!message) {
    return ''
  }

  const text = message.deletedAt ? 'Сообщение удалено' : message.text ?? 'Вложение'

  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function setMessageElement(messageId: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof Element) {
    messageElements.set(messageId, element)
    return
  }

  messageElements.delete(messageId)
}

async function focusMessage(messageId: string) {
  await nextTick()

  const element = messageElements.get(messageId)

  if (!element) {
    return
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })

  highlightedMessageId.value = messageId

  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }

  highlightTimer = setTimeout(() => {
    highlightedMessageId.value = null
    highlightTimer = null
  }, 1000)
}

function upsertMessage(message: Message) {
  if (message.chatId !== activeChatId.value) {
    return
  }

  const existingIndex = messages.value.findIndex((item) => item.id === message.id)

  if (existingIndex === -1) {
    messages.value = [...messages.value, message]
    return
  }

  messages.value = messages.value.map((item, index) => index === existingIndex ? message : item)
}

function removeMessage(message: Message) {
  if (message.chatId !== activeChatId.value) {
    return
  }

  upsertMessage(message)
}

function subscribeToActiveChat(chatId: string | null) {
  if (!chatId || !realtimeClient.value?.connected) {
    return
  }

  realtimeClient.value.emit('chat.subscribe', { chatId }, (response) => {
    if (!response.ok) {
      error.value = response.error
    }
  })
}

function connectRealtime() {
  if (!auth.accessToken || realtimeClient.value) {
    return
  }

  const client = createChatRealtimeClient(auth.accessToken)

  client.on('connect', () => {
    subscribeToActiveChat(activeChatId.value)
  })
  client.on('connect_error', () => {
    error.value = 'Не удалось подключиться к обновлениям чата'
  })
  client.on('chat.message.created', (message) => {
    upsertMessage(message)
    void loadChats()
  })
  client.on('chat.message.updated', upsertMessage)
  client.on('chat.message.deleted', removeMessage)
  client.connect()

  realtimeClient.value = client
}

function disconnectRealtime() {
  realtimeClient.value?.disconnect()
  realtimeClient.value = null
}

async function loadChats() {
  if (!auth.accessToken) {
    return
  }

  try {
    error.value = null
    const nextChats = await listChats(activeChatQuery.value, auth.accessToken)
    chats.value = nextChats
    const requestedChatId = getRequestedChatId()

    if (requestedChatId && nextChats.some((chat) => chat.id === requestedChatId)) {
      activeChatId.value = requestedChatId
      return
    }

    if (!nextChats.some((chat) => chat.id === activeChatId.value)) {
      activeChatId.value = nextChats[0]?.id ?? null
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить чаты'
  }
}

function selectFilter(filter: ChatFilterKey) {
  if (filter === activeFilter.value) {
    return
  }

  activeFilter.value = filter
  void loadChats()
}

async function loadMessages(chatId: string | null) {
  if (!chatId || !auth.accessToken) {
    messages.value = []
    return
  }

  try {
    messages.value = await listMessages(chatId, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить сообщения'
  }
}

async function submitMessage() {
  const text = composerText.value.trim()
  if (!activeChatId.value || !auth.accessToken || isSending.value || (!text && selectedFiles.value.length === 0)) {
    return
  }

  isSending.value = true

  try {
    const uploadedFiles = []

    for (const file of selectedFiles.value) {
      uploadedFiles.push(await uploadFile(file, 'messages', auth.accessToken))
    }

    const message = await createMessage(activeChatId.value, {
      ...(text ? { text } : {}),
      ...(uploadedFiles.length > 0 ? { fileIds: uploadedFiles.map((file) => file.id) } : {}),
      ...(replyTarget.value ? { replyToMessageId: replyTarget.value.id } : {})
    }, auth.accessToken)
    upsertMessage(message)
    composerText.value = ''
    selectedFiles.value = []
    replyTarget.value = null
    await loadChats()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось отправить сообщение')
  } finally {
    isSending.value = false
  }
}

onMounted(() => {
  connectRealtime()
  void loadChats()
})

onBeforeUnmount(() => {
  if (highlightTimer) {
    clearTimeout(highlightTimer)
  }

  disconnectRealtime()
})

watch(activeChatId, (chatId) => {
  replyTarget.value = null
  void loadMessages(chatId)
  subscribeToActiveChat(chatId)

  if (chatId && route.query.chatId !== chatId) {
    void router.replace({
      query: {
        ...route.query,
        chatId
      }
    })
  }
})
watch(() => route.query.chatId, () => {
  const requestedChatId = getRequestedChatId()

  if (requestedChatId && requestedChatId !== activeChatId.value) {
    activeChatId.value = requestedChatId
  }
})
watch(() => route.query.groupId, () => {
  if (typeof route.query.groupId === 'string') {
    activeFilter.value = 'GROUP'
  }

  void loadChats()
})
</script>

<template>
  <main class="chats-shell">
    <aside class="chat-list">
      <div class="chat-list__header">
        <h1>Чаты</h1>
        <div class="chat-filters" aria-label="Фильтры чатов">
          <button
            v-for="filter in filterItems"
            :key="filter.key"
            :class="['chat-filter', filter.key === activeFilter && 'chat-filter--active']"
            type="button"
            :aria-pressed="filter.key === activeFilter"
            @click="selectFilter(filter.key)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <div class="chat-list__scroll">
        <article
          v-for="chat in chats"
          :key="chat.id"
          :class="['chat-list__item', chat.id === activeChatId && 'chat-list__item--active']"
          @click="activeChatId = chat.id"
        >
          <div class="chat-list__avatar-wrap">
            <img
              v-if="getChatAvatarUrl(chat)"
              class="chat-list__avatar"
              :src="getChatAvatarUrl(chat) ?? undefined"
              :alt="getChatTitle(chat)"
            />
            <span
              v-else
              :class="['chat-list__icon', chat.chatType === 'GROUP' && 'chat-list__icon--primary']"
            >
              <component :is="chat.chatType === 'GROUP' ? Users : GraduationCap" :size="22" />
            </span>
          </div>

          <div class="chat-list__copy">
            <div>
              <h2>{{ getChatTitle(chat) }}</h2>
              <time>{{ formatTime(chat.lastMessageAt ?? chat.updatedAt) }}</time>
            </div>
            <p>{{ getChatPreview(chat) }}</p>
          </div>
        </article>
        <EmptyState
          v-if="chats.length === 0 && !error"
          title="Чатов пока нет"
          description="Здесь будут отображаться ваши личные и групповые чаты"
        />
        <EmptyState v-if="error" title="Не удалось загрузить чаты" :description="error" />
      </div>
    </aside>

    <section v-if="activeChat" class="chat-room" aria-label="Активный чат">
      <header class="chat-room__header">
        <div class="chat-room__identity">
          <span class="chat-room__icon"><Users :size="22" /></span>
          <div>
            <h2>{{ getChatTitle(activeChat) }}</h2>
            <p v-if="activeChat.chatType !== 'DIRECT'"><span />{{ activeChat.members.length }} участников</p>
          </div>
        </div>
        <div class="chat-room__tools">
          <button type="button" aria-label="Поиск в чате"><Search :size="20" /></button>
          <button type="button" aria-label="Настройки чата"><MoreVertical :size="20" /></button>
        </div>
      </header>

      <div class="chat-room__messages">
        <div class="chat-date">Сообщения</div>

        <article
          v-for="message in messages"
          :key="message.id"
          :ref="(element) => setMessageElement(message.id, element)"
          :data-message-id="message.id"
          :class="[
            'message',
            message.authorId === auth.user?.id ? 'message--outgoing' : 'message--incoming',
            highlightedMessageId === message.id && 'message--highlighted'
          ]"
        >
          <img
            v-if="message.authorId !== auth.user?.id && message.author.avatarUrl"
            :src="message.author.avatarUrl"
            :alt="message.author.displayName"
          />
          <div class="message__stack">
            <div class="message__bubble">
              <strong v-if="message.authorId !== auth.user?.id">{{ message.author.displayName }}</strong>
              <button
                v-if="message.replyToMessage"
                class="message__reply-preview"
                type="button"
                @click="focusMessage(message.replyToMessage.id)"
              >
                <span>{{ message.replyToMessage.author.displayName }}</span>
                <p>{{ getReplyPreviewText(message.replyToMessage) }}</p>
              </button>
              <span v-if="message.deletedAt" class="message__text">Сообщение удалено</span>
              <span v-else-if="message.text" class="message__text">{{ message.text }}</span>
              <div v-if="!message.deletedAt && message.files.length > 0" class="message__files">
                <a
                  v-for="file in message.files"
                  :key="file.id"
                  class="message__file"
                  :href="file.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText :size="16" /> {{ file.originalName }} <span>{{ formatFileSize(file.sizeBytes) }}</span>
                </a>
              </div>
            </div>
            <div class="message__meta">
              <button
                v-if="!message.deletedAt"
                class="message__reply"
                type="button"
                @click="replyTarget = message"
              >
                <Reply :size="14" /> Ответить
              </button>
              <time>{{ formatTime(message.createdAt) }} <CheckCheck v-if="message.authorId === auth.user?.id" :size="14" /></time>
            </div>
          </div>
        </article>
        <EmptyState v-if="messages.length === 0" title="Сообщений пока нет" />
      </div>

      <form class="chat-composer" @submit.prevent="submitMessage">
        <input ref="fileInput" class="chat-composer__file-input" type="file" multiple @change="selectFiles" />
        <button type="button" aria-label="Прикрепить файл" @click="pickFiles"><PlusCircle :size="24" /></button>
        <div class="chat-composer__body">
          <div v-if="replyTarget" class="chat-composer__reply">
            <button type="button" class="chat-composer__reply-target" @click="focusMessage(replyTarget.id)">
              <span>{{ replyTarget.author.displayName }}</span>
              <p>{{ getReplySnippetText(replyTarget) }}</p>
            </button>
            <button type="button" class="chat-composer__reply-close" aria-label="Убрать ответ" @click="replyTarget = null"><X :size="16" /></button>
          </div>
          <div v-if="selectedFiles.length > 0" class="chat-composer__attachments">
            <button
              v-for="(file, index) in selectedFiles"
              :key="`${file.name}-${index}`"
              type="button"
              @click="removeSelectedFile(index)"
            >
              <FileText :size="15" /> {{ file.name }} <X :size="14" />
            </button>
          </div>
          <div class="chat-composer__field">
            <input v-model="composerText" placeholder="Написать сообщение..." />
          </div>
        </div>
        <button class="chat-composer__send" type="submit" :disabled="isSending" aria-label="Отправить сообщение"><Send :size="20" /></button>
      </form>
    </section>
    <section v-else class="chat-room chat-room--empty" aria-label="Чат не выбран">
      <EmptyState title="Выберите чат, чтобы начать общение" />
    </section>
  </main>
</template>

<style scoped>
.chats-shell {
  --chat-incoming-border: rgb(119 118 130 / 30%);
  --chat-layout-divider: color-mix(in srgb, var(--color-nav-border) 64%, var(--color-outline) 36%);
  --chat-list-active-bg: color-mix(in srgb, var(--color-primary-container) 11%, var(--color-surface-lowest));
  --chat-list-active-border: color-mix(in srgb, var(--color-primary-container) 42%, var(--color-outline-variant));
  --chat-list-divider: color-mix(in srgb, var(--color-outline-variant) 72%, var(--color-surface-low));
  --chat-outgoing-bg: #dceeff;
  --chat-outgoing-border: #9cc4e8;
  --chat-outgoing-shadow: rgb(56 112 168 / 34%);
  --chat-outgoing-text: #13283e;
  background: var(--color-surface);
  display: grid;
  grid-template-columns: minmax(320px, 384px) minmax(0, 1fr);
  height: 100vh;
  overflow: hidden;
  padding-top: 64px;
}

:global(:root[data-theme='dark']) .chats-shell {
  --chat-incoming-border: rgb(92 112 166 / 46%);
  --chat-list-active-bg: color-mix(in srgb, var(--color-primary-container) 28%, var(--color-surface-lowest));
  --chat-list-active-border: color-mix(in srgb, var(--color-primary-container) 68%, var(--color-outline-variant));
  --chat-list-divider: color-mix(in srgb, var(--color-outline-variant) 76%, var(--color-surface-low));
  --chat-outgoing-bg: #1d3f67;
  --chat-outgoing-border: #416d9e;
  --chat-outgoing-shadow: rgb(0 7 26 / 58%);
  --chat-outgoing-text: #eef6ff;
}

.chat-list {
  background: var(--color-surface-low);
  border-right: 1px solid var(--chat-layout-divider);
  box-shadow: 1px 0 0 color-mix(in srgb, var(--chat-layout-divider) 48%, transparent);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-list__header {
  padding: 28px 24px 18px;
}

.chat-list__header h1 {
  color: var(--color-primary);
  font-size: 1.65rem;
  letter-spacing: 0;
  line-height: 1;
  margin: 0 0 22px;
}

.chat-filters {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.chat-filter {
  background: var(--color-surface-highest);
  border: 0;
  border-radius: 999px;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  min-height: 36px;
  transition: background-color 160ms ease, color 160ms ease;
}

.chat-filter--active {
  background: var(--color-primary);
  color: #fff;
}

.chat-list__scroll {
  display: grid;
  min-height: 0;
  overflow-y: auto;
  padding: 0 0 24px;
  border-top: 1px solid var(--chat-list-divider);
}

.chat-list__item {
  align-items: center;
  background: transparent;
  border-bottom: 1px solid var(--chat-list-divider);
  border-left: 4px solid transparent;
  border-radius: 0;
  cursor: pointer;
  display: grid;
  gap: 14px;
  grid-template-columns: 48px minmax(0, 1fr);
  min-width: 0;
  padding: 15px 24px 15px 20px;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.chat-list__item:hover {
  background: var(--color-list-hover);
}

.chat-list__item--active {
  background: var(--chat-list-active-bg);
  border-bottom-color: var(--chat-list-active-border);
  border-left-color: var(--color-primary-container);
  box-shadow: inset 0 1px 0 var(--chat-list-active-border), inset 0 -1px 0 var(--chat-list-active-border);
}

.chat-list__avatar-wrap {
  position: relative;
}

.chat-list__avatar,
.chat-list__icon {
  border-radius: 50%;
  height: 48px;
  width: 48px;
}

.chat-list__avatar {
  object-fit: cover;
}

.chat-list__icon {
  align-items: center;
  background: var(--color-secondary-container);
  color: var(--color-secondary);
  display: inline-flex;
  justify-content: center;
}

.chat-list__icon--primary {
  background: var(--color-primary-container);
  color: #fff;
}

.chat-list__online {
  background: #25b768;
  border: 2px solid var(--color-surface-low);
  border-radius: 50%;
  bottom: 0;
  height: 12px;
  position: absolute;
  right: 0;
  width: 12px;
}

.chat-list__copy {
  min-width: 0;
}

.chat-list__copy div {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  min-width: 0;
}

.chat-list__copy h2 {
  color: var(--color-text);
  font-size: 0.9rem;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-list__item--active h2 {
  color: var(--color-primary);
}

.chat-list__copy time {
  color: var(--color-text-muted);
  flex: 0 0 auto;
  font-size: 0.66rem;
  font-weight: 750;
}

.chat-list__copy p {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 5px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-room {
  background: var(--color-surface);
  display: grid;
  grid-template-rows: 80px minmax(0, 1fr) auto;
  min-height: 0;
  min-width: 0;
}

.chat-room__header {
  align-items: center;
  background: var(--color-chat-header-surface);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-divider);
  display: flex;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 2;
}

.chat-room__identity {
  align-items: center;
  display: flex;
  gap: 14px;
}

.chat-room__icon {
  align-items: center;
  background: var(--color-primary-container);
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.chat-room__identity h2,
.chat-room__identity p {
  margin: 0;
}

.chat-room__identity h2 {
  color: var(--color-primary);
  font-size: 1.1rem;
  letter-spacing: 0;
}

.chat-room__identity p {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  font-size: 0.68rem;
  font-weight: 850;
  gap: 8px;
  letter-spacing: 0.08em;
  margin-top: 4px;
  text-transform: uppercase;
}

.chat-room__identity p span {
  background: #25b768;
  border-radius: 50%;
  height: 7px;
  width: 7px;
}

.chat-room__tools {
  display: flex;
  gap: 6px;
}

.chat-room__tools button,
.chat-composer button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.chat-room__tools button {
  height: 42px;
  width: 42px;
}

.chat-room__tools button:hover,
.chat-composer button:hover {
  background: var(--color-surface-low);
  color: var(--color-primary);
}

.chat-room__messages {
  background: var(--color-surface-bright);
  display: grid;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px 30px;
}

.chat-date {
  background: var(--color-surface-low);
  border-radius: 999px;
  color: var(--color-subtle-text);
  font-size: 0.64rem;
  font-weight: 900;
  justify-self: center;
  letter-spacing: 0.14em;
  margin-bottom: 12px;
  padding: 7px 14px;
  text-transform: uppercase;
}

.message {
  align-items: end;
  display: flex;
  gap: 11px;
  max-width: min(47%, 680px);
  min-width: min(360px, 100%);
  transition: filter 220ms ease;
}

.message img,
.message__system-avatar {
  border-radius: 50%;
  flex: 0 0 auto;
  height: 34px;
  width: 34px;
}

.message img {
  object-fit: cover;
}

.message__system-avatar {
  align-items: center;
  background: var(--color-secondary-container);
  color: var(--color-secondary);
  display: inline-flex;
  justify-content: center;
}

.message--continued {
  margin-top: -8px;
}

.message--continued.message--incoming {
  margin-left: 45px;
}

.message--outgoing {
  justify-self: end;
  margin-left: auto;
}

.message--system .message__bubble {
  font-style: italic;
}

.message--highlighted .message__bubble {
  animation: message-highlight 1000ms ease-out;
}

.message__stack {
  display: grid;
  gap: 5px;
  min-width: 0;
  width: 100%;
}

.message__bubble {
  background: var(--color-surface-low);
  border: 1px solid var(--chat-incoming-border);
  border-radius: 18px;
  border-bottom-left-radius: 3px;
  box-shadow: 0 10px 24px -22px rgb(27 27 32 / 32%);
  color: var(--color-text);
  font-size: 0.92rem;
  line-height: 1.55;
  min-width: min(340px, 100%);
  padding: 14px 18px;
  width: 100%;
}

.message__bubble strong {
  color: var(--color-primary);
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  margin-bottom: 5px;
}

.message--outgoing .message__bubble {
  background: var(--chat-outgoing-bg);
  border-color: var(--chat-outgoing-border);
  border-bottom-left-radius: 18px;
  border-bottom-right-radius: 3px;
  box-shadow: 0 14px 30px -22px var(--chat-outgoing-shadow);
  color: var(--chat-outgoing-text);
}

.message__text {
  display: block;
  max-width: calc(100% - 56px);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message__reply-preview {
  appearance: none;
  background: rgb(255 255 255 / 44%);
  border: 0;
  border-left: 3px solid currentColor;
  border-radius: 10px;
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 2px;
  margin-bottom: 8px;
  padding: 7px 9px;
  text-align: left;
  width: 100%;
}

.message__reply-preview:hover {
  filter: brightness(0.97);
}

.message__reply-preview span {
  font-size: 0.68rem;
  font-weight: 850;
}

.message__reply-preview p {
  margin: 0;
  opacity: 0.82;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message__files {
  display: grid;
  gap: 7px;
  margin-top: 8px;
}

.message time {
  align-items: center;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.68rem;
  font-weight: 700;
  gap: 4px;
  padding: 0 4px;
}

.message__meta {
  align-items: center;
  display: flex;
  gap: 8px;
}

.message--outgoing time {
  justify-content: flex-end;
}

.message--outgoing .message__meta {
  justify-content: flex-end;
}

.message__reply {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  font-size: 0.68rem;
  font-weight: 800;
  gap: 4px;
  padding: 0;
}

.message__reply:hover {
  color: var(--color-primary);
}

.message__file {
  align-items: center;
  color: var(--color-primary);
  display: inline-flex;
  font-style: normal;
  font-weight: 850;
  gap: 5px;
  text-decoration: underline;
}

.message--outgoing .message__file {
  color: var(--chat-outgoing-text);
}

.message__file span {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  text-decoration: none;
}

.chat-composer {
  align-items: center;
  background: var(--color-surface);
  border-top: 1px solid var(--chat-layout-divider);
  box-shadow: 0 -1px 0 color-mix(in srgb, var(--chat-layout-divider) 58%, transparent);
  display: grid;
  gap: 12px;
  grid-template-columns: 44px minmax(0, 1fr) 48px;
  padding: 18px 32px 24px;
}

.chat-composer__file-input {
  display: none;
}

.chat-composer > button {
  height: 44px;
  width: 44px;
}

.chat-composer__body {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.chat-composer__reply {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0;
  color: var(--color-text);
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) 32px;
  min-width: 0;
  overflow: hidden;
  padding: 0 4px 2px;
}

.chat-composer .chat-composer__reply-target {
  align-items: start;
  justify-items: start;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 6px;
  justify-content: stretch;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 2px 0;
  text-align: left;
  width: 100%;
}

.chat-composer .chat-composer__reply-target:hover {
  filter: brightness(0.98);
}

.chat-composer__reply span {
  color: var(--color-text);
  display: block;
  font-size: 0.86rem;
  font-weight: 850;
  line-height: 1.2;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.chat-composer__reply p {
  color: var(--color-text-muted);
  display: block;
  font-size: 0.98rem;
  line-height: 1.32;
  margin: 0;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.chat-composer__reply-close {
  height: 30px;
  width: 30px;
}

.chat-composer__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-composer__attachments button {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  color: var(--color-primary);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 6px;
  max-width: 100%;
  min-height: 32px;
  padding: 0 10px;
}

.chat-composer__field {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid transparent;
  border-radius: 999px;
  display: flex;
  min-height: 50px;
  padding: 0 10px 0 22px;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.chat-composer__field:focus-within {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
}

.chat-composer__field input {
  background: transparent;
  border: 0;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
  outline: none;
}

.chat-composer__field input::placeholder {
  color: var(--color-placeholder);
}

.chat-composer__send {
  background: var(--color-primary) !important;
  color: #fff !important;
  height: 48px !important;
  width: 48px !important;
}

.chat-composer__send:hover {
  background: var(--color-primary-container) !important;
  transform: scale(1.03);
}

.chat-composer__send:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

@keyframes message-highlight {
  0% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 34%, transparent), 0 18px 34px -20px var(--color-primary);
    filter: brightness(1.05);
  }

  70% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 16%, transparent), 0 14px 28px -22px var(--color-primary);
    filter: brightness(1.02);
  }

  100% {
    box-shadow: 0 10px 24px -22px rgb(27 27 32 / 32%);
    filter: brightness(1);
  }
}

@media (max-width: 900px) {
  .chats-shell {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .chat-list {
    border-bottom: 1px solid var(--chat-layout-divider);
    border-right: 0;
    box-shadow: 0 1px 0 color-mix(in srgb, var(--chat-layout-divider) 48%, transparent);
    max-height: 42vh;
  }

  .chat-room {
    min-height: 72vh;
  }

  .message {
    max-width: 92%;
    min-width: min(280px, 100%);
  }

  .message__bubble {
    min-width: min(260px, 100%);
  }

  .message__text {
    max-width: calc(100% - 36px);
  }
}

@media (max-width: 620px) {
  .chat-room__header,
  .chat-room__messages,
  .chat-composer {
    padding-left: 18px;
    padding-right: 18px;
  }

  .chat-composer {
    gap: 8px;
    grid-template-columns: 40px minmax(0, 1fr) 44px;
  }

  .chat-composer > button {
    height: 40px;
    width: 40px;
  }

  .chat-composer__send {
    height: 44px !important;
    width: 44px !important;
  }
}
</style>
