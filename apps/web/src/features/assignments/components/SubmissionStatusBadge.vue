<script setup lang="ts">
import type { SubmissionStatus } from '../api/assignments.api'
import { submissionStatusLabels } from '../lib/assignments.ui'

defineProps<{
  status: SubmissionStatus
}>()
</script>

<template>
  <span :class="['submission-status-badge', `submission-status-badge--${status.toLowerCase()}`]">
    {{ submissionStatusLabels[status] }}
  </span>
</template>

<style scoped>
.submission-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 800;
}

.submission-status-badge--draft {
  background: rgba(20, 32, 51, 0.08);
  color: var(--color-text);
}

.submission-status-badge--submitted {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.submission-status-badge--reviewed {
  background: var(--color-success-soft);
  color: var(--color-success);
}
</style>
