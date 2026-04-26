<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatShortDate } from '@/shared/lib/date'

const group = useDemoGroup()
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Практика"
      title="Задания"
      description="Домашние задания и проверка прогресса внутри группы."
      align="split"
    >
      <template #actions>
        <RouterLink :to="{ name: 'group-assignment-create', params: { groupId: group.id } }">
          <AppButton><Plus :size="18" /> Новое задание</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <ContentList title="Активные задания">
      <WorkspaceItem
        v-for="assignment in group.assignments"
        :key="assignment.id"
        :title="assignment.title"
        :description="`${assignment.submissions} решений отправлено`"
        :meta="`Дедлайн ${formatShortDate(assignment.dueDate)}`"
      >
        <template #aside>
          <RouterLink :to="{ name: 'group-assignment-submissions', params: { groupId: group.id, assignmentId: assignment.id } }">
            <AppButton variant="secondary" size="sm">Проверить</AppButton>
          </RouterLink>
          <StatusPill label="Published" tone="success" />
        </template>
      </WorkspaceItem>
    </ContentList>
  </main>
</template>
