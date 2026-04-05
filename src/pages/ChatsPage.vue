<script setup lang="ts">
import { computed, ref } from 'vue'
import { chats } from '../data/mockDashboard'

const chatMode = ref<'group' | 'direct'>('group')
const chatSearchQuery = ref('')
const selectedChatId = ref(
  chats.find((chat) => chat.kind === 'group')?.id ?? chats[0]?.id ?? 0,
)

const visibleChats = computed(() =>
  chats.filter((chat) => {
    const byMode = chat.kind === chatMode.value
    const bySearch =
      chatSearchQuery.value.trim().length === 0 ||
      chat.title.toLowerCase().includes(chatSearchQuery.value.trim().toLowerCase())

    return byMode && bySearch
  }),
)

const selectedChat = computed(
  () => visibleChats.value.find((chat) => chat.id === selectedChatId.value) ?? visibleChats.value[0],
)

const switchMode = (mode: 'group' | 'direct') => {
  chatMode.value = mode
  selectedChatId.value = chats.find((chat) => chat.kind === mode)?.id ?? 0
}
</script>

<template>
  <main class="dashboard-layout chat-page-shell">
    <section class="dashboard-main chat-page-main">
      <section class="chat-layout">
        <aside class="chat-sidebar">
          <header class="chat-sidebar-header">
            <div class="chat-sidebar-title">
              <h2>Чаты</h2>
              <span>{{ visibleChats.length }}</span>
            </div>

            <div class="chat-mode-switch">
              <button
                type="button"
                class="chat-mode-btn"
                :class="{ active: chatMode === 'group' }"
                @click="switchMode('group')"
              >
                Группы
              </button>
              <button
                type="button"
                class="chat-mode-btn"
                :class="{ active: chatMode === 'direct' }"
                @click="switchMode('direct')"
              >
                Личные
              </button>
            </div>

            <label class="chat-list-search" aria-label="Поиск по чатам">
              <span class="material-symbols-outlined search-icon">search</span>
              <input v-model="chatSearchQuery" type="text" placeholder="Поиск чатов..." />
            </label>
          </header>

          <div class="chat-list">
            <button
              v-for="chat in visibleChats"
              :key="chat.id"
              type="button"
              class="chat-list-item"
              :class="{ active: selectedChat?.id === chat.id }"
              @click="selectedChatId = chat.id"
            >
              <div class="chat-list-avatar">
                {{ chat.title.slice(0, 1) }}
              </div>

              <div class="chat-list-copy">
                <div class="chat-list-top">
                  <strong>{{ chat.title }}</strong>
                  <span>{{ chat.lastTime }}</span>
                </div>
                <p>{{ chat.lastMessage }}</p>
              </div>

              <div class="chat-list-meta">
                <span v-if="chat.online" class="chat-online-dot"></span>
                <span v-if="chat.unreadCount > 0" class="chat-unread">{{ chat.unreadCount }}</span>
              </div>
            </button>
          </div>
        </aside>

        <section v-if="selectedChat" class="chat-window">
          <header class="chat-window-header">
            <div class="chat-window-profile">
              <div class="chat-list-avatar large">
                {{ selectedChat.title.slice(0, 1) }}
              </div>

              <div>
                <h2>{{ selectedChat.title }}</h2>
                <p v-if="selectedChat.online">в сети</p>
                <p v-else>{{ selectedChat.subtitle }}</p>
              </div>
            </div>

            <div class="chat-window-actions">
              <button type="button" class="chat-window-icon" aria-label="Поиск в чате">
                <span class="material-symbols-outlined">search</span>
              </button>
              <button type="button" class="chat-window-icon" aria-label="Еще">
                <span class="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
          </header>

          <div class="chat-messages">
            <article
              v-for="message in selectedChat.messages"
              :key="message.id"
              class="chat-message-row"
              :class="{ own: message.own }"
            >
              <div v-if="!message.own" class="chat-message-avatar">
                {{ message.author.slice(0, 1) }}
              </div>

              <div class="chat-message" :class="{ own: message.own }">
                <strong v-if="!message.own">{{ message.author }}</strong>
                <p>{{ message.text }}</p>
                <span>{{ message.time }}</span>
              </div>
            </article>
          </div>

          <footer class="chat-input">
            <button type="button" class="chat-input-icon" aria-label="Прикрепить файл">
              <span class="material-symbols-outlined">attach_file</span>
            </button>
            <input type="text" placeholder="Написать сообщение..." />
            <button type="button" class="chat-send-btn" aria-label="Отправить">
              <span class="material-symbols-outlined">send</span>
            </button>
          </footer>
        </section>
      </section>
    </section>
  </main>
</template>
