<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="empty-state">
    <div class="empty-state__badge">○</div>
    <div class="empty-state__copy">
      <h2 class="empty-state__title">{{ title }}</h2>
      <p class="empty-state__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.empty-state {
  display: grid;
  gap: 1rem;
  padding: 16px;
  border: 1px dashed #c6d3df;
  border-radius: 18px;
  background: #f9fbfd;
}

.empty-state__badge {
  display: inline-grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: #dff0fb;
  color: var(--color-accent-strong);
  font-weight: 800;
}

.empty-state__copy {
  display: grid;
  gap: 0.45rem;
}

.empty-state__title {
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.empty-state__description {
  color: var(--color-subtle);
}

.empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
