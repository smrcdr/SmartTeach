<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const group = useDemoGroup()
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Календарь"
      title="Расписание"
      description="Занятия, дедлайны и события группы в одном календарном потоке."
      align="split"
    >
      <template #actions>
        <RouterLink :to="{ name: 'group-schedule-event-create', params: { groupId: group.id } }">
          <AppButton><Plus :size="18" /> Событие</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <ContentList title="Ближайшие события">
      <WorkspaceItem
        v-for="event in group.schedule"
        :key="event.id"
        :title="event.title"
        :description="event.place"
        :meta="formatDateTime(event.startsAt)"
      >
        <template #aside>
          <StatusPill label="Planned" tone="primary" />
        </template>
      </WorkspaceItem>
    </ContentList>
  </main>
</template>
