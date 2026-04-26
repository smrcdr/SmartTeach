<script setup lang="ts">
import { getLesson } from '@/features/groups/api/groups.api'
import { useGroupRouteItem } from '@/features/groups/composables/useGroupRouteResource'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const { item: lesson, error } = useGroupRouteItem('lessonId', getLesson)
</script>

<template>
  <main v-if="lesson" class="page narrow-page">
    <AppPageHeader eyebrow="Урок" :title="lesson.title" :description="lesson.content ?? undefined" align="split">
      <template #actions>
        <StatusPill :label="lesson.status" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </template>
    </AppPageHeader>
    <section class="reading-panel surface-panel">
      <p>{{ lesson.content ?? 'Материал урока пока не заполнен.' }}</p>
    </section>
  </main>
  <main v-else class="page narrow-page">
    <EmptyState title="Урок не загружен" :description="error ?? 'Данные урока ожидаются от API.'" />
  </main>
</template>

<style scoped>
.reading-panel {
  color: var(--color-text-muted);
  display: grid;
  font-size: 1.05rem;
  gap: 18px;
  line-height: 1.75;
  padding: clamp(24px, 4vw, 38px);
}

.reading-panel p {
  margin: 0;
}
</style>
