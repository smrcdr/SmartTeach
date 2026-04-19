<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="error-state">
    <div class="error-state__badge">!</div>
    <div class="error-state__copy">
      <h2 class="error-state__title">{{ title }}</h2>
      <p class="error-state__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="error-state__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.error-state {
  display: grid;
  gap: 1rem;
  padding: 1.4rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-md);
  background: var(--color-danger-soft);
}

.error-state__badge {
  display: inline-grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: rgba(156, 71, 71, 0.12);
  color: var(--color-danger);
  font-weight: 800;
}

.error-state__copy {
  display: grid;
  gap: 0.45rem;
}

.error-state__title {
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.error-state__description {
  color: var(--color-danger);
}

.error-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
