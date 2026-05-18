<script setup lang="ts">
import { MessageCirclePlus, MoreVertical, Pencil, Trash2, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createGroupChat, deleteGroupChat, listGroupChats, updateGroupChat } from '@/features/chats/api/chats.api'
import type { Chat } from '@/features/chats/api/chats.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()
const { group } = useGroup()
const { items: chats, groupId, refresh } = useGroupRouteList(listGroupChats)
const canManage = computed(() => canManageGroup(group.value))
const title = ref('')
const isSubmitting = ref(false)
const activeActionsChatId = ref<string | null>(null)
const editingChat = ref<Chat | null>(null)
const deletingChat = ref<Chat | null>(null)
const editTitle = ref('')
const isUpdating = ref(false)
const isDeleting = ref(false)

function getChatTitle(chat: Chat) {
  return chat.title ?? 'Групповой чат'
}

function toggleChatActions(chatId: string) {
  if (!canManage.value) {
    return
  }

  activeActionsChatId.value = activeActionsChatId.value === chatId ? null : chatId
}

function openChatActions(chatId: string) {
  if (!canManage.value) {
    return
  }

  activeActionsChatId.value = chatId
}

function openEditModal(chat: Chat) {
  editingChat.value = chat
  editTitle.value = getChatTitle(chat)
  activeActionsChatId.value = null
}

function closeEditModal() {
  if (isUpdating.value) {
    return
  }

  editingChat.value = null
  editTitle.value = ''
}

function openDeleteModal(chat: Chat) {
  deletingChat.value = chat
  activeActionsChatId.value = null
}

function closeDeleteModal() {
  if (isDeleting.value) {
    return
  }

  deletingChat.value = null
}

async function submit() {
  if (!auth.accessToken || !groupId.value || isSubmitting.value) {
    return
  }

  const normalizedTitle = title.value.trim()

  if (normalizedTitle.length < 2) {
    notifications.error('Название чата должно быть не короче 2 символов')
    return
  }

  isSubmitting.value = true

  try {
    await createGroupChat(groupId.value, { title: normalizedTitle }, auth.accessToken)
    title.value = ''
    notifications.success('Чат группы создан')
    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось создать чат')
  } finally {
    isSubmitting.value = false
  }
}

async function submitEdit() {
  if (!auth.accessToken || !groupId.value || !editingChat.value || isUpdating.value) {
    return
  }

  const normalizedTitle = editTitle.value.trim()

  if (normalizedTitle.length < 2) {
    notifications.error('Название чата должно быть не короче 2 символов')
    return
  }

  isUpdating.value = true

  try {
    await updateGroupChat(groupId.value, editingChat.value.id, { title: normalizedTitle }, auth.accessToken)
    notifications.success('Чат обновлён')
    editingChat.value = null
    editTitle.value = ''
    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось обновить чат')
  } finally {
    isUpdating.value = false
  }
}

async function confirmDelete() {
  if (!auth.accessToken || !groupId.value || !deletingChat.value || isDeleting.value) {
    return
  }

  isDeleting.value = true

  try {
    await deleteGroupChat(groupId.value, deletingChat.value.id, auth.accessToken)
    notifications.success('Чат удалён')
    deletingChat.value = null
    await refresh()
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось удалить чат')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Коммуникация"
      title="Чаты группы"
      description="Темы для обсуждений, ревью и быстрых вопросов внутри учебного процесса."
      align="split"
    >
      <template v-if="canManage" #actions>
        <RouterLink :to="{ name: 'chats', query: { groupId } }">
          <AppButton variant="secondary">Открыть чаты</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <form v-if="canManage" class="group-chat-form surface-panel" @submit.prevent="submit">
      <AppTextField v-model="title" name="title" label="Новый чат" placeholder="Например: Общие вопросы" />
      <AppButton type="submit" :disabled="isSubmitting">
        <MessageCirclePlus :size="18" /> {{ isSubmitting ? 'Создаём...' : 'Создать чат' }}
      </AppButton>
    </form>

    <ContentList title="Каналы">
      <WorkspaceItem
        v-for="chat in chats"
        :key="chat.id"
        class="group-chat-item"
        :title="getChatTitle(chat)"
        :description="chat.lastMessageAt ? `Последнее сообщение ${chat.lastMessageAt}` : 'Сообщений пока нет'"
        @contextmenu.prevent="openChatActions(chat.id)"
      >
        <template #aside>
          <div class="group-chat-actions" @click.stop>
            <RouterLink :to="{ name: 'chats', query: { chatId: chat.id } }">
              <AppButton size="sm" variant="secondary">Открыть</AppButton>
            </RouterLink>
            <button
              v-if="canManage"
              type="button"
              class="group-chat-actions__trigger"
              aria-label="Действия с чатом"
              :aria-expanded="activeActionsChatId === chat.id"
              @click="toggleChatActions(chat.id)"
            >
              <MoreVertical :size="18" />
            </button>
            <div v-if="canManage && activeActionsChatId === chat.id" class="group-chat-actions__menu" role="menu">
              <button type="button" role="menuitem" @click="openEditModal(chat)">
                <Pencil :size="17" />
                Редактировать
              </button>
              <button type="button" role="menuitem" class="group-chat-actions__delete" @click="openDeleteModal(chat)">
                <Trash2 :size="17" />
                Удалить
              </button>
            </div>
          </div>
        </template>
      </WorkspaceItem>
      <EmptyState v-if="chats.length === 0" title="Чатов пока нет" />
    </ContentList>

    <div v-if="editingChat" class="group-chat-modal" role="presentation" @click.self="closeEditModal">
      <section class="group-chat-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="edit-chat-title">
        <header class="group-chat-modal__header">
          <div>
            <p>Чат группы</p>
            <h2 id="edit-chat-title">Редактировать название</h2>
          </div>
          <button type="button" aria-label="Закрыть" @click="closeEditModal">
            <X :size="20" />
          </button>
        </header>
        <form class="group-chat-modal__form" @submit.prevent="submitEdit">
          <AppTextField v-model="editTitle" name="edit-title" label="Название чата" />
          <div class="group-chat-modal__actions">
            <AppButton type="button" variant="secondary" @click="closeEditModal">Отмена</AppButton>
            <AppButton type="submit" :disabled="isUpdating">{{ isUpdating ? 'Сохраняем...' : 'Сохранить' }}</AppButton>
          </div>
        </form>
      </section>
    </div>

    <div v-if="deletingChat" class="group-chat-modal" role="presentation" @click.self="closeDeleteModal">
      <section class="group-chat-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title">
        <header class="group-chat-modal__header">
          <div>
            <p>Удаление чата</p>
            <h2 id="delete-chat-title">Удалить «{{ getChatTitle(deletingChat) }}»?</h2>
          </div>
          <button type="button" aria-label="Закрыть" @click="closeDeleteModal">
            <X :size="20" />
          </button>
        </header>
        <p class="group-chat-modal__copy">После удаления чат и его сообщения больше не будут доступны участникам группы.</p>
        <div class="group-chat-modal__actions">
          <AppButton type="button" variant="secondary" @click="closeDeleteModal">Отмена</AppButton>
          <button type="button" class="group-chat-modal__danger" :disabled="isDeleting" @click="confirmDelete">
            {{ isDeleting ? 'Удаляем...' : 'Удалить' }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.group-chat-form {
  align-items: end;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) auto;
  margin-bottom: 24px;
  padding: 20px;
}

.group-chat-item {
  cursor: pointer;
}

.group-chat-actions {
  align-items: center;
  display: flex;
  gap: 10px;
  position: relative;
}

.group-chat-actions__trigger,
.group-chat-modal__header button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.group-chat-actions__trigger:hover,
.group-chat-modal__header button:hover {
  background: var(--color-surface-low);
  color: var(--color-primary);
}

.group-chat-actions__menu {
  background: var(--color-menu-surface);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 4px;
  min-width: 190px;
  padding: 8px;
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 4;
}

.group-chat-actions__menu button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  font-weight: 700;
  gap: 10px;
  min-height: 38px;
  padding: 0 12px;
  text-align: left;
}

.group-chat-actions__menu button:hover {
  background: var(--color-menu-hover);
  color: var(--color-primary);
}

.group-chat-actions__menu .group-chat-actions__delete {
  color: var(--color-error);
}

.group-chat-modal {
  align-items: center;
  background: rgb(17 24 39 / 52%);
  display: grid;
  inset: 0;
  justify-items: center;
  padding: 24px;
  position: fixed;
  z-index: 40;
}

.group-chat-modal__dialog {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-ambient);
  display: grid;
  gap: 22px;
  max-width: 540px;
  padding: 26px;
  width: min(100%, 540px);
}

.group-chat-modal__header {
  align-items: start;
  display: flex;
  gap: 18px;
  justify-content: space-between;
}

.group-chat-modal__header p {
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.group-chat-modal__header h2 {
  color: var(--color-text);
  font-size: 1.5rem;
  line-height: 1.15;
  margin: 0;
}

.group-chat-modal__form {
  display: grid;
  gap: 18px;
}

.group-chat-modal__copy {
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.group-chat-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.group-chat-modal__danger {
  background: var(--color-error);
  border: 0;
  border-radius: var(--radius-sm);
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  min-height: 42px;
  padding: 0 20px;
}

.group-chat-modal__danger:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 680px) {
  .group-chat-form {
    align-items: stretch;
    grid-template-columns: 1fr;
  }
}
</style>
