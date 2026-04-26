<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  meta?: string
}>()
</script>

<template>
  <article class="workspace-item">
    <div>
      <span v-if="meta" class="workspace-item__meta">{{ meta }}</span>
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.aside" class="workspace-item__aside">
      <slot name="aside" />
    </div>
  </article>
</template>

<style scoped>
.workspace-item {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  padding: 20px;
}

.workspace-item__meta {
  color: var(--color-text-muted);
  display: block;
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.workspace-item h3 {
  color: var(--color-primary);
  font-size: 1.08rem;
  margin: 0;
}

.workspace-item p {
  color: var(--color-text-muted);
  line-height: 1.55;
  margin: 7px 0 0;
}

.workspace-item__aside {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: 10px;
}

@media (max-width: 640px) {
  .workspace-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
