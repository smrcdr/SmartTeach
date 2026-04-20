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
  <section class="chat-window">
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
      <header class="chat-window-header">
        <button type="button" class="chat-thread__back" @click="emit('back')">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>

        <div class="chat-window-profile">
          <div class="chat-window-profile__avatar">
            <img
              v-if="getChatAvatarImage(chat, currentUserId)"
              :src="getChatAvatarImage(chat, currentUserId) ?? undefined"
              :alt="chatTitle"
              class="chat-list-avatar-image"
            />
            <span v-else>{{ getInitials(chatTitle) }}</span>
          </div>

          <div>
            <h2>{{ chatTitle }}</h2>
            <p>{{ chatDescription }}</p>
          </div>
        </div>

        <div class="chat-window-actions">
          <span v-if="isReadOnly" class="pill">Только чтение</span>
          <span v-if="realtime.status.value === 'connecting'" class="pill">Подключаем</span>
          <span v-else-if="realtime.status.value === 'ready'" class="pill">Онлайн</span>
        </div>
      </header>

      <div v-if="realtime.errorMessage.value" class="panel-note">
        {{ realtime.errorMessage.value }}
      </div>

      <div v-if="actionError" class="chat-thread__action-error">
        {{ actionError }}
      </div>

      <div class="chat-messages">
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

        <div v-else class="chat-thread__messages">
          <article
            v-for="message in messages"
            :key="message.id"
            :class="[
              'chat-message-row',
              {
                own: message.authorId === currentUserId,
              },
            ]"
          >
            <div v-if="message.authorId !== currentUserId" class="chat-message-avatar">
              <img
                v-if="getAvatarUrl(message)"
                :src="getAvatarUrl(message)"
                :alt="message.author.displayName"
                class="chat-list-avatar-image"
              />
              <span v-else>{{ getInitials(message.author.displayName) }}</span>
            </div>

            <div
              :class="[
                'chat-message',
                {
                  own: message.authorId === currentUserId,
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
                  <button
                    v-if="canEditMessage(message, currentUserId)"
                    type="button"
                    class="chat-thread__message-icon-btn"
                    :disabled="deletingMessageId === message.id || isSavingEdit"
                    @click="startEditingMessage(message)"
                  >
                    <span class="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    v-if="canDeleteMessage(message, currentUserId, canModerateGroup)"
                    type="button"
                    class="chat-thread__message-icon-btn chat-thread__message-icon-btn--danger"
                    :disabled="deletingMessageId === message.id || isSavingEdit"
                    @click="handleDeleteMessage(message)"
                  >
                    <span class="material-symbols-outlined">
                      {{ deletingMessageId === message.id ? 'progress_activity' : 'delete' }}
                    </span>
                  </button>
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
            </div>
          </article>
        </div>
      </div>

      <footer v-if="canWrite" class="chat-input">
        <label class="chat-input-icon" aria-label="Прикрепить файл">
          <span class="material-symbols-outlined">attach_file</span>
          <input ref="composerFileInput" type="file" multiple class="chat-thread__file-input" @change="handleComposerFileChange" />
        </label>

        <div class="chat-thread__composer-body">
          <input
            v-model="composerText"
            type="text"
            placeholder="Написать сообщение..."
            :disabled="isUploadingComposer || createMessageMutation.isPending.value"
            @keydown.enter.prevent="handleComposerSubmit"
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

          <p v-if="composerError" class="chat-thread__message-error">{{ composerError }}</p>
        </div>

        <button
          type="button"
          class="chat-send-btn"
          :disabled="isUploadingComposer || createMessageMutation.isPending.value"
          @click="handleComposerSubmit"
        >
          <span class="chat-send-btn__label">Отправить</span>
          <span class="material-symbols-outlined">send</span>
        </button>
      </footer>

      <div v-else class="panel-note">Чат доступен только для чтения.</div>
    </template>
  </section>
</template>

<style scoped>
.chat-window {
  grid-template-rows: auto auto minmax(0, 1fr) auto;
}

.chat-window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 5.2rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2eaf1;
  background: #ffffff;
}

.chat-window-profile {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.chat-window-profile__avatar,
.chat-message-avatar {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  border-radius: 999px;
  background: #e8f1fb;
  color: #336689;
  font-weight: 700;
  overflow: hidden;
}

.chat-window-profile h2 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.1;
  color: #1f3042;
}

.chat-window-profile p {
  margin: 0.2rem 0 0;
  color: #64788d;
  font-size: 0.9rem;
}

.chat-window-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.chat-thread__back {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.45rem;
  height: 2.45rem;
  border-radius: 999px;
  background: #f5f9fc;
  border: 1px solid #d0dbe5;
  color: #60758d;
}

.chat-thread__history-actions {
  display: grid;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.chat-thread__messages {
  display: grid;
  gap: 1rem;
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
  gap: 0.35rem 0.65rem;
  color: #6f8193;
  font-size: 0.8rem;
}

.chat-thread__message-meta strong {
  color: #1f3042;
}

.chat-thread__message-actions,
.chat-thread__editor-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.chat-thread__message-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 999px;
  color: #6e8194;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.chat-thread__message-icon-btn:hover {
  background: #eef4f8;
  color: #27435c;
}

.chat-thread__message-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.chat-thread__message-icon-btn .material-symbols-outlined {
  font-size: 1.05rem;
}

.chat-thread__message-icon-btn--danger:hover {
  background: #fff1f1;
  color: #9a4747;
}

.chat-messages {
  display: grid;
  gap: 0.85rem;
  min-height: 0;
  padding: 1rem 1.1rem 0.85rem;
  overflow-y: auto;
  background: #ffffff;
}

.chat-message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.65rem;
}

.chat-message-row.own {
  justify-content: flex-end;
}

.chat-message {
  display: grid;
  gap: 0.45rem;
  max-width: min(38rem, 74%);
  padding: 0.8rem 0.95rem;
  border: 1px solid #dce6ef;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.03);
}

.chat-message.own {
  background: linear-gradient(180deg, #317cb2 0%, #276d9d 100%);
  border-color: #226390;
}

.chat-message.own .chat-thread__message-meta,
.chat-message.own .chat-thread__message-text,
.chat-message.own .chat-thread__message-time,
.chat-message.own .chat-thread__file-list a,
.chat-message.own .chat-thread__placeholder {
  color: #ffffff;
}

.chat-message.own .chat-thread__message-meta strong {
  color: #ffffff;
}

.chat-thread__message--deleted {
  background: #f8fbfd;
  border-style: dashed;
}

.chat-thread__message-text,
.chat-thread__placeholder {
  margin: 0;
  line-height: 1.55;
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
  color: #7d8fa1;
  font-size: 0.78rem;
}

.chat-thread__textarea {
  width: 100%;
  min-height: 7rem;
  padding: 0.9rem 1rem;
  border: 1px solid #c2cfdb;
  border-radius: 14px;
  background: #f9fbfd;
  color: var(--color-text);
  resize: vertical;
  outline: none;
}

.chat-thread__textarea:focus {
  border-color: #9fd2ec;
  background: #ffffff;
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
  border: 1px solid #c6d3df;
  border-radius: 14px;
  background: #f9fbfd;
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
  padding: 12px 14px;
  border: 1px solid #f1c9c9;
  border-radius: 14px;
  background: #fff1f1;
  color: #8a2f2f;
}

.chat-thread__composer-body {
  display: grid;
  gap: 10px;
  width: 100%;
}

.chat-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: end;
  padding: 0.8rem 1rem 1rem;
  border-top: 1px solid #e2eaf1;
  background: #ffffff;
}

.chat-input-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border: 1px solid #d5e0ea;
  border-radius: 999px;
  background: #f7fafc;
  color: #667a8f;
  cursor: pointer;
}

.chat-thread__composer-body input {
  width: 100%;
  min-width: 0;
  min-height: 2.9rem;
  padding: 0 14px;
  border: 1px solid #d5e0ea;
  border-radius: 14px;
  outline: none;
  color: #334155;
  background: #f7fafc;
}

.chat-thread__composer-body input::placeholder {
  color: #94a3b8;
}

.chat-send-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.9rem;
  padding: 0 0.95rem;
  border-radius: 12px;
  background: linear-gradient(180deg, #2f80b8 0%, #266f9f 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.chat-send-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.chat-send-btn__label {
  display: inline;
}

.chat-list-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

@media (max-width: 900px) {
  .chat-window-header {
    padding-inline: 1rem;
  }

  .chat-thread__back {
    display: inline-flex;
  }

  .chat-message {
    max-width: 88%;
  }
}

@media (max-width: 640px) {
  .chat-window-header,
  .chat-input {
    grid-template-columns: 1fr;
  }

  .chat-window-actions {
    justify-content: flex-start;
  }

  .chat-send-btn {
    justify-content: center;
  }
}
</style>
