<script setup lang="ts">
import { myGroups } from '@/app/demo/demo-data'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
</script>

<template>
  <main class="page chats-page">
    <AppPageHeader
      eyebrow="Коммуникация"
      title="Чаты"
      description="Единое место для групповых обсуждений, личных сообщений и рабочих каналов."
    />

    <section class="chat-workspace surface-panel">
      <aside class="chat-workspace__sidebar">
        <article
          v-for="chat in myGroups[0].chats"
          :key="chat.id"
          class="chat-thread"
        >
          <div>
            <h2>{{ chat.title }}</h2>
            <p>{{ chat.lastMessage }}</p>
          </div>
          <StatusPill v-if="chat.unreadCount" :label="String(chat.unreadCount)" tone="primary" />
        </article>
      </aside>

      <section class="chat-workspace__thread">
        <span class="eyebrow">Общий чат</span>
        <h2>Материалы к занятию уже в уроках.</h2>
        <div class="message-row message-row--incoming">Ссылки и записи занятия добавлены в раздел уроков.</div>
        <div class="message-row message-row--outgoing">Спасибо, посмотрю перед дедлайном.</div>
        <form class="chat-workspace__composer">
          <input placeholder="Написать сообщение..." />
          <AppButton type="submit">Отправить</AppButton>
        </form>
      </section>
    </section>
  </main>
</template>

<style scoped>
.chat-workspace {
  display: grid;
  grid-template-columns: 340px 1fr;
  min-height: 620px;
  overflow: hidden;
}

.chat-workspace__sidebar {
  background: var(--color-surface-low);
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 18px;
}

.chat-thread {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 16px;
}

.chat-thread h2,
.chat-thread p {
  margin: 0;
}

.chat-thread h2 {
  color: var(--color-primary);
  font-size: 1rem;
  margin-bottom: 6px;
}

.chat-thread p {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.chat-workspace__thread {
  align-content: start;
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 42px);
}

.chat-workspace__thread h2 {
  color: var(--color-primary);
  font-size: 1.8rem;
  margin: 0;
}

.message-row {
  border-radius: var(--radius-lg);
  line-height: 1.55;
  max-width: 620px;
  padding: 16px 18px;
}

.message-row--incoming {
  background: var(--color-surface-low);
  color: var(--color-text);
}

.message-row--outgoing {
  background: var(--color-primary);
  color: #fff;
  justify-self: end;
}

.chat-workspace__composer {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr auto;
  margin-top: auto;
}

.chat-workspace__composer input {
  background: var(--color-surface-low);
  border: 0;
  border-radius: var(--radius-md);
  min-height: 48px;
  padding: 0 16px;
}

@media (max-width: 920px) {
  .chat-workspace {
    grid-template-columns: 1fr;
  }
}
</style>
