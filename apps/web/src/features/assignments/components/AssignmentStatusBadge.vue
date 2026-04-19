<script setup lang="ts">
import type { AssignmentStatus } from '../api/assignments.api'
import { assignmentStatusLabels } from '../lib/assignments.ui'

defineProps<{
  status: AssignmentStatus
}>()
</script>

<template>
  <span :class="['assignment-status-badge', `assignment-status-badge--${status.toLowerCase()}`]">
    {{ assignmentStatusLabels[status] }}
  </span>
</template>

<style scoped>
.assignment-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
  font-weight: 800;
}

.assignment-status-badge--draft {
  background: rgba(20, 32, 51, 0.08);
  color: var(--color-text);
}

.assignment-status-badge--published {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.assignment-status-badge--archived {
  background: rgba(156, 71, 71, 0.1);
  color: var(--color-danger);
}
</style>
