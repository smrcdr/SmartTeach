<script setup lang="ts">
import type { LessonStatus } from '../api/lessons.api'
import { lessonStatusLabels } from '../lib/lessons.ui'

defineProps<{
  status: LessonStatus
}>()
</script>

<template>
  <span :class="['lesson-status-badge', `lesson-status-badge--${status.toLowerCase()}`]">
    {{ lessonStatusLabels[status] }}
  </span>
</template>

<style scoped>
.lesson-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 800;
}

.lesson-status-badge--draft {
  background: rgba(20, 32, 51, 0.08);
  color: var(--color-text);
}

.lesson-status-badge--published {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.lesson-status-badge--archived {
  background: rgba(156, 71, 71, 0.1);
  color: var(--color-danger);
}
</style>
