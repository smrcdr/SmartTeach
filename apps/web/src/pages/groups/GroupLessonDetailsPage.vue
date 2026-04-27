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
    <AppPageHeader eyebrow="Материал" :title="lesson.title" :description="lesson.content ?? undefined" align="split">
      <template #actions>
        <StatusPill :label="lesson.status" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </template>
    </AppPageHeader>
    <section class="reading-panel surface-panel">
      <p>{{ lesson.content ?? 'Материал урока пока не заполнен.' }}</p>
      <div v-if="lesson.files.length > 0" class="reading-panel__files">
        <a
          v-for="file in lesson.files"
          :key="file.id"
          :href="file.url"
          target="_blank"
          rel="noreferrer"
        >
          {{ file.originalName }}
        </a>
      </div>
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

.reading-panel__files {
  border-top: 1px solid var(--color-divider);
  display: grid;
  gap: 10px;
  padding-top: 18px;
}

.reading-panel__files a {
  color: var(--color-primary);
  font-weight: 780;
}

.reading-panel__files a:hover {
  text-decoration: underline;
}
</style>
