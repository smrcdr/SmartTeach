<script setup lang="ts">
import type { Chat, ChatMessage, ChatType } from '../api/chats.api'
import {
  formatChatActivity,
  getChatAvatarImage,
  getChatAvatarLabel,
  getChatPreview,
  getChatTitle,
} from '../lib/chats.ui'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppEmptyState from '../../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../../shared/ui/AppErrorState.vue'
import AppLoader from '../../../shared/ui/AppLoader.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    chats: Chat[]
    previews: Record<string, ChatMessage | null>
    activeChatId: string | null
    currentUserId: string
    showTabs?: boolean
    activeTab?: ChatType
    isPending: boolean
    errorMessage: string
    emptyTitle: string
    emptyDescription: string
    canCreateGroupChat?: boolean
  }>(),
  {
    showTabs: false,
    activeTab: 'DIRECT',
    canCreateGroupChat: false,
  },
)

const emit = defineEmits<{
  selectChat: [chatId: string]
  switchTab: [chatType: ChatType]
  createGroupChat: []
}>()
</script>

<template>
  <aside class="chat-sidebar">
    <div class="chat-sidebar__header">
      <div class="chat-sidebar__copy">
        <span class="page-eyebrow">Чаты</span>
        <h2 class="chat-sidebar__title">{{ title }}</h2>
        <p class="muted">{{ description }}</p>
      </div>

      <AppButton v-if="canCreateGroupChat" size="sm" @click="emit('createGroupChat')">Создать чат</AppButton>
    </div>

    <div v-if="showTabs" class="chat-sidebar__tabs" role="tablist" aria-label="Тип чатов">
      <button
        type="button"
        :class="['chat-sidebar__tab', { 'chat-sidebar__tab--active': activeTab === 'DIRECT' }]"
        @click="emit('switchTab', 'DIRECT')"
      >
        Личные
      </button>
      <button
        type="button"
        :class="['chat-sidebar__tab', { 'chat-sidebar__tab--active': activeTab === 'GROUP' }]"
        @click="emit('switchTab', 'GROUP')"
      >
        Групповые
      </button>
    </div>

    <AppLoader v-if="isPending" label="Загружаем список чатов" />

    <AppErrorState
      v-else-if="errorMessage"
      title="Не удалось загрузить чаты"
      :description="errorMessage"
    />

    <AppEmptyState
      v-else-if="chats.length === 0"
      :title="emptyTitle"
      :description="emptyDescription"
    >
      <template #actions>
        <AppButton v-if="canCreateGroupChat" size="sm" @click="emit('createGroupChat')">Создать первый чат</AppButton>
      </template>
    </AppEmptyState>

    <ul v-else class="chat-sidebar__list">
      <li v-for="chat in chats" :key="chat.id">
        <button
          type="button"
          :class="['chat-sidebar__item', { 'chat-sidebar__item--active': chat.id === activeChatId }]"
          @click="emit('selectChat', chat.id)"
        >
          <div class="chat-sidebar__avatar">
            <img
              v-if="getChatAvatarImage(chat, currentUserId)"
              :src="getChatAvatarImage(chat, currentUserId) ?? undefined"
              :alt="getChatTitle(chat, currentUserId)"
              class="chat-sidebar__avatar-image"
            />
            <span v-else>{{ getChatAvatarLabel(chat, currentUserId) }}</span>
          </div>

          <div class="chat-sidebar__body">
            <div class="chat-sidebar__meta">
              <strong>{{ getChatTitle(chat, currentUserId) }}</strong>
              <span>{{ formatChatActivity(chat.lastMessageAt ?? chat.createdAt) }}</span>
            </div>
            <p>{{ getChatPreview(previews[chat.id] ?? null) }}</p>
          </div>
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.chat-sidebar {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.chat-sidebar__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.chat-sidebar__copy {
  display: grid;
  gap: 0.35rem;
}

.chat-sidebar__title {
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.chat-sidebar__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
}

.chat-sidebar__tab {
  min-height: 2.75rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-subtle);
  font-weight: 700;
  cursor: pointer;
}

.chat-sidebar__tab--active {
  background: var(--color-text);
  color: #ffffff;
}

.chat-sidebar__list {
  display: grid;
  gap: 0.7rem;
}

.chat-sidebar__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    background-color 160ms ease;
}

.chat-sidebar__item:hover {
  transform: translateY(-1px);
  border-color: rgba(31, 117, 156, 0.24);
}

.chat-sidebar__item--active {
  border-color: rgba(31, 117, 156, 0.28);
  background: var(--color-accent-soft);
}

.chat-sidebar__avatar {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: rgba(31, 117, 156, 0.14);
  color: var(--color-accent-strong);
  font-weight: 800;
}

.chat-sidebar__avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.chat-sidebar__body {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.chat-sidebar__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.chat-sidebar__meta strong,
.chat-sidebar__body p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-sidebar__meta span,
.chat-sidebar__body p {
  color: var(--color-subtle);
}
</style>
