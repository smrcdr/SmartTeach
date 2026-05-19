<script setup lang="ts">
defineProps<{
  label: string
  tone?: 'primary' | 'success' | 'warning' | 'muted' | 'danger'
}>()
</script>

<template>
  <span :class="['status-pill', `status-pill--${tone ?? 'primary'}`]">{{ label }}</span>
</template>

<style scoped>
.status-pill {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.68rem;
  font-weight: 850;
  justify-content: center;
  letter-spacing: 0.09em;
  min-height: 28px;
  padding: 0 11px;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-pill--primary {
  background: var(--color-primary-fixed);
  border-color: color-mix(in srgb, var(--color-primary-container) 28%, transparent);
  color: var(--color-primary);
}

.status-pill--success {
  background: #dff8e9;
  border-color: rgb(15 106 63 / 16%);
  color: #0f6a3f;
}

.status-pill--warning {
  background: var(--color-secondary-container);
  border-color: color-mix(in srgb, var(--color-secondary) 18%, transparent);
  color: #424464;
}

.status-pill--muted {
  background: var(--color-surface-low);
  border-color: var(--color-panel-border);
  color: var(--color-text-muted);
}

.status-pill--danger {
  background: #ffdad6;
  border-color: color-mix(in srgb, var(--color-error) 18%, transparent);
  color: var(--color-error);
}
</style>
