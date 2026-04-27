<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import { listAssignments } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatShortDate } from '@/shared/lib/date'

const { group } = useGroup()
const { items: assignments, groupId } = useGroupRouteList(listAssignments)
const canManage = computed(() => canManageGroup(group.value))
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Практика"
      title="Задания"
      description="Домашние задания и проверка прогресса внутри группы."
      align="split"
    >
      <template v-if="canManage" #actions>
        <RouterLink :to="{ name: 'group-assignment-create', params: { groupId } }">
          <AppButton><Plus :size="18" /> Новое задание</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <ContentList title="Активные задания">
      <WorkspaceItem
        v-for="assignment in assignments"
        :key="assignment.id"
        :title="assignment.title"
        :description="assignment.content ?? undefined"
        :meta="assignment.dueAt ? `Дедлайн ${formatShortDate(assignment.dueAt)}` : undefined"
      >
        <template #aside>
          <RouterLink :to="{ name: 'group-assignment-details', params: { groupId, assignmentId: assignment.id } }">
            <AppButton variant="secondary" size="sm">Открыть</AppButton>
          </RouterLink>
          <RouterLink v-if="canManage" :to="{ name: 'group-assignment-submissions', params: { groupId, assignmentId: assignment.id } }">
            <AppButton variant="secondary" size="sm">Проверить</AppButton>
          </RouterLink>
          <StatusPill
            :label="assignment.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'"
            :tone="assignment.status === 'PUBLISHED' ? 'success' : 'muted'"
          />
        </template>
      </WorkspaceItem>
      <EmptyState v-if="assignments.length === 0" title="Заданий пока нет" />
    </ContentList>
  </main>
</template>
