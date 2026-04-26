<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  detail?: string
  icon?: Component
}>()
</script>

<template>
  <article class="metric">
    <component :is="icon" v-if="icon" class="metric__icon" :size="20" />
    <span class="metric__label">{{ label }}</span>
    <strong>{{ value }}</strong>
    <p v-if="detail">{{ detail }}</p>
  </article>
</template>

<style scoped>
.metric {
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 22px;
  position: relative;
}

.metric__icon {
  color: var(--color-primary);
  opacity: 0.72;
}

.metric__label {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.metric strong {
  color: var(--color-primary);
  font-size: 2rem;
  line-height: 1;
}

.metric p {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
  margin: 0;
}
</style>
