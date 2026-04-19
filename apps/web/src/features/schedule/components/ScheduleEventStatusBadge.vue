<script setup lang="ts">
import type { ScheduleEventStatus } from '../api/schedule.api'
import { scheduleEventStatusLabels } from '../lib/schedule.ui'

defineProps<{
  status: ScheduleEventStatus
}>()
</script>

<template>
  <span :class="['schedule-event-status-badge', `schedule-event-status-badge--${status.toLowerCase()}`]">
    {{ scheduleEventStatusLabels[status] }}
  </span>
</template>

<style scoped>
.schedule-event-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.7rem;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: 0.84rem;
  font-weight: 800;
}

.schedule-event-status-badge--planned {
  border-color: rgba(31, 117, 156, 0.18);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.schedule-event-status-badge--cancelled {
  border-color: rgba(156, 71, 71, 0.22);
  background: rgba(156, 71, 71, 0.12);
  color: var(--color-danger);
}
</style>
