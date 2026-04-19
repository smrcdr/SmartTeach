<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  deleteUploadedChatFile,
  getChatsErrorMessage,
  uploadChatFiles,
  type Chat,
  type ChatFile,
  type ChatMessage,
} from '../api/chats.api'
import { useActiveChatRealtime } from '../composables/useChatRealtime'
import {
  useChatMessages,
  useCreateMessageMutation,
  useDeleteMessageMutation,
  useUpdateMessageMutation,
} from '../composables/useChats'
import {
  buildMessagePlaceholder,
  canDeleteMessage,
  canEditMessage,
  dedupeMessages,
  formatFileSize,
  formatMessageDate,
  formatMessageTime,
  getChatDescription,
  getChatAvatarImage,
  getChatTitle,
  getInitials,
  getMessageAuthorLabel,
  normalizeOptionalText,
  normalizeNullableString,
  sortMessages,
} from '../lib/chats.ui'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppEmptyState from '../../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../../shared/ui/AppErrorState.vue'
import AppLoader from '../../../shared/ui/AppLoader.vue'

const props = withDefaults(
  defineProps<{
    chat: Chat | null
    currentUserId: string
    emptyTitle: string
    emptyDescription: string
    isChatPending?: boolean
    chatErrorMessage?: string
    canModerateGroup?: boolean
    isReadOnly?: boolean
  }>(),
  {
    isChatPending: false,
    chatErrorMessage: '',
    canModerateGroup: false,
    isReadOnly: false,
  },
)

const emit = defineEmits<{
  back: []
}>()

const composerFileInput = ref<HTMLInputElement | null>(null)
const editFileInput = ref<HTMLInputElement | null>(null)

const composerText = ref('')
const composerFiles = ref<File[]>([])
const composerError = ref('')
const actionError = ref('')
const isUploadingComposer = ref(false)

const editingMessageId = ref('')
const editText = ref('')
const editKeptFiles = ref<ChatFile[]>([])
const editNewFiles = ref<File[]>([])
const editError = ref('')
const isSavingEdit = ref(false)
const deletingMessageId = ref('')

const activeChatId = computed(() => props.chat?.id ?? '')
const messagesQuery = useChatMessages(activeChatId, {
  enabled: computed(() => Boolean(props.chat)),
})
const createMessageMutation = useCreateMessageMutation(activeChatId)
const updateMessageMutation = useUpdateMessageMutation(activeChatId)
const deleteMessageMutation = useDeleteMessageMutation(activeChatId)
const realtime = useActiveChatRealtime(activeChatId, {
  enabled: computed(() => Boolean(props.chat)),
})

const chatTitle = computed(() => (props.chat ? getChatTitle(props.chat, props.currentUserId) : ''))
const chatDescription = computed(() => (props.chat ? getChatDescription(props.chat, props.currentUserId) : ''))
const messages = computed(() =>
  sortMessages(dedupeMessages((messagesQuery.data.value?.pages.flat() ?? []) as ChatMessage[])),
)
const messagesErrorMessage = computed(() => {
  const error = messagesQuery.error.value

  return error ? getChatsErrorMessage(error, 'Не удалось загрузить сообщения') : ''
})
const canWrite = computed(() => Boolean(props.chat) && !props.isReadOnly)

watch(
  () => props.chat?.id,
  () => {
    composerText.value = ''
    composerFiles.value = []
    composerError.value = ''
    actionError.value = ''
    resetEditState()
  },
  {
    immediate: true,
  },
)

function handleComposerFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const nextFiles = Array.from(target.files ?? [])

  if (nextFiles.length > 0) {
    composerFiles.value = [...composerFiles.value, ...nextFiles]
  }

  target.value = ''
}

function removeComposerFile(index: number) {
  composerFiles.value = composerFiles.value.filter((_, currentIndex) => currentIndex !== index)
}

async function handleComposerSubmit() {
  if (!props.chat || !canWrite.value) {
    return
  }

  composerError.value = ''
  actionError.value = ''
  isUploadingComposer.value = true

  let uploadedFiles: ChatFile[] = []

  try {
    uploadedFiles = await uploadChatFiles(composerFiles.value)

    await createMessageMutation.mutateAsync({
      text: composerText.value,
      fileIds: uploadedFiles.map((file) => file.id),
    })

    composerText.value = ''
    composerFiles.value = []

    if (composerFileInput.value) {
      composerFileInput.value.value = ''
    }
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(uploadedFiles.map((file) => deleteUploadedChatFile(file.id)))
    }

    composerError.value = getChatsErrorMessage(error, 'Не удалось отправить сообщение')
  } finally {
    isUploadingComposer.value = false
  }
}

function startEditingMessage(message: ChatMessage) {
  editingMessageId.value = message.id
  editText.value = message.text ?? ''
  editKeptFiles.value = [...message.files]
  editNewFiles.value = []
  editError.value = ''
  actionError.value = ''
}

function resetEditState() {
  editingMessageId.value = ''
  editText.value = ''
  editKeptFiles.value = []
  editNewFiles.value = []
  editError.value = ''
}

function handleEditFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const nextFiles = Array.from(target.files ?? [])

  if (nextFiles.length > 0) {
    editNewFiles.value = [...editNewFiles.value, ...nextFiles]
  }

  target.value = ''
}

function removeEditNewFile(index: number) {
  editNewFiles.value = editNewFiles.value.filter((_, currentIndex) => currentIndex !== index)
}

function removeEditKeptFile(fileId: string) {
  editKeptFiles.value = editKeptFiles.value.filter((file) => file.id !== fileId)
}

async function handleEditSubmit(message: ChatMessage) {
  if (!props.chat || editingMessageId.value !== message.id) {
    return
  }

  editError.value = ''
  actionError.value = ''
  isSavingEdit.value = true

  let uploadedFiles: ChatFile[] = []

  try {
    uploadedFiles = await uploadChatFiles(editNewFiles.value)

    await updateMessageMutation.mutateAsync({
      messageId: message.id,
      payload: {
        text: editText.value,
        fileIds: [...editKeptFiles.value.map((file) => file.id), ...uploadedFiles.map((file) => file.id)],
      },
    })

    resetEditState()

    if (editFileInput.value) {
      editFileInput.value.value = ''
    }
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(uploadedFiles.map((file) => deleteUploadedChatFile(file.id)))
    }

    editError.value = getChatsErrorMessage(error, 'Не удалось сохранить изменения сообщения')
  } finally {
    isSavingEdit.value = false
  }
}

async function handleDeleteMessage(message: ChatMessage) {
  if (!props.chat) {
    return
  }

  const isOwnMessage = message.authorId === props.currentUserId
  const shouldProceed = window.confirm(
    isOwnMessage
      ? 'Удалить это сообщение? В ленте останется плейсхолдер.'
      : 'Удалить чужое сообщение как модератор? В ленте останется плейсхолдер.',
  )

  if (!shouldProceed) {
    return
  }

  deletingMessageId.value = message.id
  actionError.value = ''

  try {
    await deleteMessageMutation.mutateAsync({
      messageId: message.id,
      currentMessage: message,
    })
  } catch (error) {
    actionError.value = getChatsErrorMessage(error, 'Не удалось удалить сообщение')
  } finally {
    deletingMessageId.value = ''
  }
}

const hasOlderMessages = computed(() => Boolean(messagesQuery.hasPreviousPage.value))
const isLoadingOlder = computed(() => messagesQuery.isFetchingPreviousPage.value)

function getAvatarUrl(message: ChatMessage) {
  return normalizeNullableString(message.author.avatarUrl) ?? ''
}

function getAttachmentLabel(file: ChatFile) {
  return `${file.originalName} · ${formatFileSize(file.sizeBytes)}`
}
</script>

<template>
  <section class="chat-thread">
    <AppLoader v-if="isChatPending" label="Открываем активный чат" />

    <AppErrorState
      v-else-if="chatErrorMessage"
      title="Не удалось открыть чат"
      :description="chatErrorMessage"
    >
      <template #actions>
        <AppButton variant="secondary" @click="emit('back')">К списку</AppButton>
      </template>
    </AppErrorState>

    <AppEmptyState
      v-else-if="!chat"
      :title="emptyTitle"
      :description="emptyDescription"
    />

    <template v-else>
      <header class="chat-thread__header">
        <button type="button" class="chat-thread__back" @click="emit('back')">Назад к списку</button>

        <div class="chat-thread__identity">
          <div class="chat-thread__avatar">
            <img
              v-if="getChatAvatarImage(chat, currentUserId)"
              :src="getChatAvatarImage(chat, currentUserId) ?? undefined"
              :alt="chatTitle"
              class="chat-thread__avatar-image"
            />
            <span v-else>{{ getInitials(chatTitle) }}</span>
          </div>

          <div class="chat-thread__copy">
            <h2 class="chat-thread__title">{{ chatTitle }}</h2>
            <p class="muted">{{ chatDescription }}</p>
          </div>
        </div>

        <div class="chat-thread__status">
          <span v-if="isReadOnly" class="pill">Только чтение</span>
          <span v-if="realtime.status.value === 'connecting'" class="pill">Подключаем обновления</span>
          <span v-else-if="realtime.status.value === 'ready'" class="pill">Онлайн-обновление активно</span>
        </div>
      </header>

      <div v-if="realtime.errorMessage.value" class="panel-note">
        {{ realtime.errorMessage.value }}
      </div>

      <div v-if="actionError" class="chat-thread__action-error">
        {{ actionError }}
      </div>

      <div class="chat-thread__history">
        <div class="chat-thread__history-actions">
          <AppButton
            v-if="hasOlderMessages"
            variant="ghost"
            size="sm"
            :disabled="isLoadingOlder"
            @click="messagesQuery.fetchPreviousPage()"
          >
            {{ isLoadingOlder ? 'Загружаем...' : 'Загрузить предыдущие' }}
          </AppButton>
        </div>

        <AppLoader v-if="messagesQuery.isPending.value" label="Загружаем историю переписки" />

        <AppErrorState
          v-else-if="messagesErrorMessage"
          title="Не удалось загрузить сообщения"
          :description="messagesErrorMessage"
        />

        <AppEmptyState
          v-else-if="messages.length === 0"
          title="Лента пока пустая"
          description="Первое сообщение появится здесь сразу после отправки."
        />

        <ul v-else class="chat-thread__messages">
          <li
            v-for="message in messages"
            :key="message.id"
            :class="[
              'chat-thread__message-row',
              {
                'chat-thread__message-row--own': message.authorId === currentUserId,
              },
            ]"
          >
            <div class="chat-thread__message-avatar">
              <img
                v-if="getAvatarUrl(message)"
                :src="getAvatarUrl(message)"
                :alt="message.author.displayName"
                class="chat-thread__message-avatar-image"
              />
              <span v-else>{{ getInitials(message.author.displayName) }}</span>
            </div>

            <article
              :class="[
                'chat-thread__message',
                {
                  'chat-thread__message--own': message.authorId === currentUserId,
                  'chat-thread__message--deleted': Boolean(message.deletedAt),
                },
              ]"
            >
              <div class="chat-thread__message-header">
                <div class="chat-thread__message-meta">
                  <strong>{{ getMessageAuthorLabel(message, currentUserId) }}</strong>
                  <span>{{ formatMessageDate(message.createdAt) }}</span>
                  <span v-if="message.editedAt && !message.deletedAt">изменено</span>
                </div>

                <div
                  v-if="!isReadOnly && (canEditMessage(message, currentUserId) || canDeleteMessage(message, currentUserId, canModerateGroup))"
                  class="chat-thread__message-actions"
                >
                  <AppButton
                    v-if="canEditMessage(message, currentUserId)"
                    variant="ghost"
                    size="sm"
                    :disabled="deletingMessageId === message.id || isSavingEdit"
                    @click="startEditingMessage(message)"
                  >
                    Редактировать
                  </AppButton>
                  <AppButton
                    v-if="canDeleteMessage(message, currentUserId, canModerateGroup)"
                    variant="ghost"
                    size="sm"
                    :disabled="deletingMessageId === message.id || isSavingEdit"
                    @click="handleDeleteMessage(message)"
                  >
                    {{ deletingMessageId === message.id ? 'Удаляем...' : 'Удалить' }}
                  </AppButton>
                </div>
              </div>

              <template v-if="editingMessageId === message.id">
                <div class="chat-thread__editor">
                  <textarea
                    v-model="editText"
                    class="chat-thread__textarea"
                    rows="4"
                    placeholder="Обновите текст сообщения"
                    :disabled="isSavingEdit"
                  />

                  <div
                    v-if="editKeptFiles.length > 0 || editNewFiles.length > 0"
                    class="chat-thread__attachments"
                  >
                    <div
                      v-for="file in editKeptFiles"
                      :key="file.id"
                      class="chat-thread__attachment"
                    >
                      <span>{{ getAttachmentLabel(file) }}</span>
                      <button type="button" @click="removeEditKeptFile(file.id)">Убрать</button>
                    </div>

                    <div
                      v-for="(file, index) in editNewFiles"
                      :key="`${file.name}:${file.size}:${index}`"
                      class="chat-thread__attachment"
                    >
                      <span>{{ `${file.name} · ${formatFileSize(file.size)}` }}</span>
                      <button type="button" @click="removeEditNewFile(index)">Убрать</button>
                    </div>
                  </div>

                  <label class="chat-thread__file-trigger">
                    <input ref="editFileInput" type="file" multiple class="chat-thread__file-input" @change="handleEditFileChange" />
                    <span>Добавить вложения</span>
                  </label>

                  <p v-if="editError" class="chat-thread__message-error">{{ editError }}</p>

                  <div class="chat-thread__editor-actions">
                    <AppButton variant="secondary" size="sm" :disabled="isSavingEdit" @click="resetEditState">
                      Отмена
                    </AppButton>
                    <AppButton size="sm" :disabled="isSavingEdit" @click="handleEditSubmit(message)">
                      {{ isSavingEdit ? 'Сохраняем...' : 'Сохранить' }}
                    </AppButton>
                  </div>
                </div>
              </template>

              <template v-else>
                <p v-if="message.deletedAt" class="chat-thread__placeholder">
                  {{ buildMessagePlaceholder(message) }}
                </p>
                <p v-else-if="normalizeOptionalText(message.text)" class="chat-thread__message-text">
                  {{ message.text }}
                </p>

                <ul v-if="!message.deletedAt && message.files.length > 0" class="chat-thread__file-list">
                  <li v-for="file in message.files" :key="file.id">
                    <a :href="file.url" target="_blank" rel="noreferrer">
                      {{ getAttachmentLabel(file) }}
                    </a>
                  </li>
                </ul>

                <span class="chat-thread__message-time">{{ formatMessageTime(message.createdAt) }}</span>
              </template>
            </article>
          </li>
        </ul>
      </div>

      <div v-if="canWrite" class="chat-thread__composer">
        <textarea
          v-model="composerText"
          class="chat-thread__textarea"
          rows="4"
          placeholder="Напишите сообщение или добавьте вложение"
          :disabled="isUploadingComposer || createMessageMutation.isPending.value"
        />

        <div v-if="composerFiles.length > 0" class="chat-thread__attachments">
          <div
            v-for="(file, index) in composerFiles"
            :key="`${file.name}:${file.size}:${index}`"
            class="chat-thread__attachment"
          >
            <span>{{ `${file.name} · ${formatFileSize(file.size)}` }}</span>
            <button type="button" @click="removeComposerFile(index)">Убрать</button>
          </div>
        </div>

        <div class="chat-thread__composer-actions">
          <label class="chat-thread__file-trigger">
            <input ref="composerFileInput" type="file" multiple class="chat-thread__file-input" @change="handleComposerFileChange" />
            <span>Добавить файлы</span>
          </label>

          <AppButton
            :disabled="isUploadingComposer || createMessageMutation.isPending.value"
            @click="handleComposerSubmit"
          >
            {{ isUploadingComposer || createMessageMutation.isPending.value ? 'Отправляем...' : 'Отправить' }}
          </AppButton>
        </div>

        <p v-if="composerError" class="chat-thread__message-error">{{ composerError }}</p>
      </div>

      <div v-else class="panel-note">
        Чат доступен для чтения, но отправка и модерация сообщений сейчас отключены.
      </div>
    </template>
  </section>
</template>

<style scoped>
.chat-thread {
  display: grid;
  gap: 1rem;
  min-width: 0;
  min-height: 38rem;
}

.chat-thread__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.chat-thread__back {
  display: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-accent-strong);
  font-weight: 700;
  cursor: pointer;
}

.chat-thread__identity {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}

.chat-thread__avatar,
.chat-thread__message-avatar {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(31, 117, 156, 0.14);
  color: var(--color-accent-strong);
  font-weight: 800;
  flex-shrink: 0;
}

.chat-thread__message-avatar {
  width: 2.5rem;
  height: 2.5rem;
}

.chat-thread__avatar-image,
.chat-thread__message-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chat-thread__copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.chat-thread__title {
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.chat-thread__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chat-thread__history {
  display: grid;
  align-content: start;
  gap: 0.9rem;
  min-height: 0;
  flex: 1;
}

.chat-thread__history-actions {
  display: flex;
  justify-content: center;
}

.chat-thread__messages {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.chat-thread__message-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: end;
}

.chat-thread__message-row--own {
  grid-template-columns: minmax(0, 1fr) auto;
}

.chat-thread__message-row--own .chat-thread__message-avatar {
  order: 2;
}

.chat-thread__message {
  display: grid;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.78);
}

.chat-thread__message--own {
  background: var(--color-accent-soft);
}

.chat-thread__message--deleted {
  background: rgba(255, 255, 255, 0.54);
}

.chat-thread__message-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.chat-thread__message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.75rem;
  color: var(--color-subtle);
  font-size: 0.88rem;
}

.chat-thread__message-actions,
.chat-thread__editor-actions,
.chat-thread__composer-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.chat-thread__message-text,
.chat-thread__placeholder {
  line-height: 1.65;
  white-space: pre-wrap;
}

.chat-thread__placeholder {
  color: var(--color-subtle);
  font-style: italic;
}

.chat-thread__file-list,
.chat-thread__attachments {
  display: grid;
  gap: 0.55rem;
}

.chat-thread__file-list a {
  color: var(--color-accent-strong);
}

.chat-thread__message-time {
  justify-self: end;
  color: var(--color-subtle);
  font-size: 0.82rem;
}

.chat-thread__composer {
  display: grid;
  gap: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.chat-thread__textarea {
  width: 100%;
  min-height: 7rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-panel);
  color: var(--color-text);
  resize: vertical;
  outline: none;
}

.chat-thread__textarea:focus {
  border-color: rgba(31, 117, 156, 0.44);
  box-shadow: 0 0 0 4px rgba(31, 117, 156, 0.1);
}

.chat-thread__file-trigger {
  display: inline-flex;
  align-items: center;
}

.chat-thread__file-trigger span {
  display: inline-flex;
  align-items: center;
  min-height: 2.45rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
}

.chat-thread__file-input {
  display: none;
}

.chat-thread__attachment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-subtle);
}

.chat-thread__attachment button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-danger);
  cursor: pointer;
}

.chat-thread__message-error,
.chat-thread__action-error {
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-sm);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .chat-thread {
    min-height: 28rem;
  }

  .chat-thread__back {
    display: inline-flex;
  }

  .chat-thread__header {
    display: grid;
    justify-content: stretch;
  }

  .chat-thread__message-row {
    grid-template-columns: 1fr;
  }

  .chat-thread__message-row--own .chat-thread__message-avatar,
  .chat-thread__message-avatar {
    display: none;
  }
}
</style>
