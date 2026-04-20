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
    <header class="chat-sidebar__header">
      <div class="chat-sidebar__topbar">
        <label class="chat-sidebar__search" aria-label="Поиск по чатам">
          <span class="material-symbols-outlined">search</span>
          <input type="text" :placeholder="showTabs ? 'Поиск чатов' : 'Поиск групповых чатов'" disabled />
        </label>

        <AppButton
          v-if="canCreateGroupChat"
          size="sm"
          variant="secondary"
          class="chat-sidebar__create"
          @click="emit('createGroupChat')"
        >
          <span class="material-symbols-outlined">add</span>
          Новый чат
        </AppButton>
      </div>

      <div v-if="showTabs" class="chat-sidebar__tabs" role="tablist" aria-label="Тип чатов">
        <button
          type="button"
          class="chat-sidebar__tab"
          :class="{ 'chat-sidebar__tab--active': activeTab === 'DIRECT' }"
          @click="emit('switchTab', 'DIRECT')"
        >
          Личные
        </button>
        <button
          type="button"
          class="chat-sidebar__tab"
          :class="{ 'chat-sidebar__tab--active': activeTab === 'GROUP' }"
          @click="emit('switchTab', 'GROUP')"
        >
          Групповые
        </button>
      </div>
    </header>

    <AppLoader v-if="isPending" label="Загружаем список чатов" />

    <AppErrorState v-else-if="errorMessage" title="Не удалось загрузить чаты" :description="errorMessage" />

    <AppEmptyState v-else-if="chats.length === 0" :title="emptyTitle" :description="emptyDescription">
      <template #actions>
        <AppButton v-if="canCreateGroupChat" size="sm" @click="emit('createGroupChat')">Создать первый чат</AppButton>
      </template>
    </AppEmptyState>

    <div v-else class="chat-sidebar__list" :aria-label="title">
      <button
        v-for="chat in chats"
        :key="chat.id"
        type="button"
        class="chat-sidebar__item"
        :class="{ 'chat-sidebar__item--active': chat.id === activeChatId }"
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

        <div class="chat-sidebar__item-copy">
          <div class="chat-sidebar__item-top">
            <strong>{{ getChatTitle(chat, currentUserId) }}</strong>
            <span>{{ formatChatActivity(chat.lastMessageAt ?? chat.createdAt) }}</span>
          </div>
          <p>{{ getChatPreview(previews[chat.id] ?? null) }}</p>
        </div>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.chat-sidebar {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  background: #ffffff;
  border: 1px solid #d8e3ec;
  border-radius: 20px;
  overflow: hidden;
}

.chat-sidebar__header {
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem;
  border-bottom: 1px solid #e2eaf1;
  background: #ffffff;
}

.chat-sidebar__topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.55rem;
  align-items: center;
}

.chat-sidebar__search {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
  min-height: 2.7rem;
  padding: 0 0.9rem;
  border: 1px solid #d5e0ea;
  border-radius: 12px;
  background: #f7fafc;
  color: #7f93a7;
}

.chat-sidebar__search .material-symbols-outlined {
  font-size: 1.05rem;
}

.chat-sidebar__search input {
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #3d4f63;
  outline: none;
}

.chat-sidebar__search input::placeholder {
  color: #8da0b2;
}

.chat-sidebar__create {
  min-height: 2.7rem;
  padding-inline: 0.95rem;
  border-radius: 12px;
}

.chat-sidebar__create :deep(.material-symbols-outlined) {
  font-size: 1.05rem;
}

.chat-sidebar__tabs {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.2rem;
  border-radius: 12px;
  background: #f2f7fb;
  width: fit-content;
}

.chat-sidebar__tab {
  min-width: 6.2rem;
  min-height: 2.1rem;
  padding: 0.35rem 0.8rem;
  border-radius: 10px;
  color: #6b7f93;
  font-weight: 700;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.chat-sidebar__tab--active {
  background: #ffffff;
  color: #244d69;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04), 0 6px 14px rgba(15, 23, 42, 0.06);
}

.chat-sidebar__list {
  display: grid;
  gap: 0.1rem;
  padding: 0.55rem;
  overflow-y: auto;
  align-content: start;
  background: #ffffff;
}

.chat-sidebar__item {
  display: grid;
  grid-template-columns: 2.9rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  padding: 0.7rem;
  border-radius: 14px;
  text-align: left;
  transition: background-color 160ms ease;
}

.chat-sidebar__item:hover {
  background: #f6fafd;
}

.chat-sidebar__item--active {
  background: #eaf7fc;
}

.chat-sidebar__avatar {
  display: grid;
  place-items: center;
  width: 2.9rem;
  height: 2.9rem;
  border-radius: 999px;
  background: #e8f1fb;
  color: #336689;
  font-weight: 700;
  overflow: hidden;
}

.chat-sidebar__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-sidebar__item-copy {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.chat-sidebar__item-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.chat-sidebar__item-top strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.98rem;
  font-weight: 700;
  color: #203142;
}

.chat-sidebar__item-top span {
  flex: none;
  color: #7f92a5;
  font-size: 0.8rem;
}

.chat-sidebar__item-copy p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #53677b;
  font-size: 0.93rem;
}

@media (max-width: 900px) {
  .chat-sidebar {
    min-height: 20rem;
  }

  .chat-sidebar__topbar {
    grid-template-columns: 1fr;
  }
}
</style>
