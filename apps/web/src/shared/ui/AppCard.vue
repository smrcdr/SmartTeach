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
  padding: 18px;
  border: 1px solid rgba(185, 199, 213, 0.95);
  border-radius: 22px;
  background: var(--color-panel);
}

.app-card--muted {
  background: var(--color-panel);
}

.app-card--accent {
  background: #f5f9fc;
  border-color: #c2cfdb;
}
</style>
