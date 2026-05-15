<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="empty-state">
    <Inbox :size="28" />
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
  </section>
</template>

<style scoped>
.empty-state {
  align-items: center;
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  display: grid;
  gap: 12px;
  justify-items: center;
  padding: 56px 24px;
  text-align: center;
}

.empty-state h2 {
  color: var(--color-primary);
  font-size: 1.25rem;
  margin: 0;
}

.empty-state p {
  line-height: 1.6;
  margin: 0;
  max-width: 520px;
}
</style>
