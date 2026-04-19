<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: 'default' | 'muted' | 'accent'
  }>(),
  {
    tone: 'default',
  },
)
</script>

<template>
  <section :class="['app-card', `app-card--${props.tone}`]">
    <slot />
  </section>
</template>

<style scoped>
.app-card {
  display: grid;
  gap: 1rem;
  padding: 1.4rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.app-card--muted {
  background: var(--color-panel-muted);
}

.app-card--accent {
  background: var(--color-panel-accent);
}
</style>
