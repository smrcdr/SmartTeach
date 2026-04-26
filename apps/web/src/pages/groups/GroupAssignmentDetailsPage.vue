<script setup lang="ts">
import { getAssignment } from '@/features/groups/api/groups.api'
import { useGroupRouteItem } from '@/features/groups/composables/useGroupRouteResource'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatShortDate } from '@/shared/lib/date'

const { item: assignment, error } = useGroupRouteItem('assignmentId', getAssignment)
</script>

<template>
  <main v-if="assignment" class="page narrow-page">
    <AppPageHeader
      eyebrow="Задание"
      :title="assignment.title"
      :description="assignment.dueAt ? `Дедлайн ${formatShortDate(assignment.dueAt)}.` : assignment.content ?? undefined"
      align="split"
    >
      <template #actions>
        <StatusPill :label="assignment.status" :tone="assignment.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </template>
    </AppPageHeader>
    <section class="surface-panel assignment-panel">
      <p>{{ assignment.content ?? 'Описание задания пока не заполнено.' }}</p>
      <AppButton>Отправить решение</AppButton>
    </section>
  </main>
  <main v-else class="page narrow-page">
    <EmptyState title="Задание не загружено" :description="error ?? 'Данные задания ожидаются от API.'" />
  </main>
</template>

<style scoped>
.assignment-panel {
  display: grid;
  gap: 22px;
  justify-items: start;
  padding: 30px;
}

.assignment-panel p {
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0;
}
</style>
