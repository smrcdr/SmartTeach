<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: 'Загрузка данных',
  },
)
</script>

<template>
  <div class="loader">
    <span class="loader__spinner" />
    <span class="loader__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.loader {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-subtle);
  padding: 12px 14px;
  border: 1px solid #c2cfdb;
  border-radius: 14px;
  background: #ffffff;
}

.loader__spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid rgba(var(--color-accent-rgb), 0.16);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 900ms linear infinite;
}

.loader__label {
  font-weight: 600;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
