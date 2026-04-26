<script setup lang="ts">
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const group = useDemoGroup()
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
        v-for="chat in group.chats"
        :key="chat.id"
        :title="chat.title"
        :description="chat.lastMessage"
      >
        <template #aside>
          <StatusPill v-if="chat.unreadCount" :label="`${chat.unreadCount} new`" tone="primary" />
        </template>
      </WorkspaceItem>
    </ContentList>
  </main>
</template>
