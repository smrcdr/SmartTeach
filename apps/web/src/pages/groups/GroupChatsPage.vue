<script setup lang="ts">
import { listGroupChats } from '@/features/chats/api/chats.api'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const { items: chats } = useGroupRouteList(listGroupChats)
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Коммуникация"
      title="Чаты группы"
      description="Темы для обсуждений, ревью и быстрых вопросов внутри учебного процесса."
    />

    <ContentList title="Каналы">
      <WorkspaceItem
        v-for="chat in chats"
        :key="chat.id"
        :title="chat.title ?? 'Групповой чат'"
        :description="chat.lastMessageAt ? `Последнее сообщение ${chat.lastMessageAt}` : 'Сообщений пока нет'"
      />
      <EmptyState v-if="chats.length === 0" title="Чатов пока нет" />
    </ContentList>
  </main>
</template>
