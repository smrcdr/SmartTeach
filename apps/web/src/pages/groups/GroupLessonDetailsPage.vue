<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const route = useRoute()
const group = useDemoGroup()
const lesson = computed(() => group.value.lessons.find((item) => item.id === route.params.lessonId) ?? group.value.lessons[0])
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Урок" :title="lesson.title" :description="lesson.summary" align="split">
      <template #actions>
        <StatusPill :label="lesson.status" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </template>
    </AppPageHeader>
    <section class="reading-panel surface-panel">
      <p>Материал урока оформляется как спокойная академическая статья: крупный заголовок, комфортная ширина строки и минимум визуального шума.</p>
      <p>Файлы, задания и дополнительные ссылки будут подключаться к этому экрану через API группы.</p>
    </section>
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
