<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import { listScheduleEvents } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const { group } = useGroup()
const { items: schedule, groupId } = useGroupRouteList(listScheduleEvents)
const canManage = computed(() => canManageGroup(group.value))
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Календарь"
      title="Расписание"
      description="Занятия, дедлайны и события группы в одном календарном потоке."
      align="split"
    >
      <template v-if="canManage" #actions>
        <RouterLink :to="{ name: 'group-schedule-event-create', params: { groupId } }">
          <AppButton><Plus :size="18" /> Событие</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <ContentList title="Ближайшие события">
      <WorkspaceItem
        v-for="event in schedule"
        :key="event.id"
        :title="event.title"
        :description="event.location ?? event.description ?? undefined"
        :meta="formatDateTime(event.startsAt)"
      >
        <template #aside>
          <StatusPill :label="event.status" :tone="event.status === 'PLANNED' ? 'primary' : 'muted'" />
        </template>
      </WorkspaceItem>
      <EmptyState v-if="schedule.length === 0" title="Событий пока нет" />
    </ContentList>
  </main>
</template>
