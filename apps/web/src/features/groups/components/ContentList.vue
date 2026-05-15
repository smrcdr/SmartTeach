<script setup lang="ts">
defineProps<{
  title: string
  eyebrow?: string
}>()
</script>

<template>
  <section class="content-list">
    <header>
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h2>{{ title }}</h2>
      <slot name="actions" />
    </header>
    <div class="content-list__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.content-list {
  background: var(--color-surface-low);
  border-radius: var(--radius-lg);
  padding: clamp(22px, 4vw, 34px);
}

.content-list header {
  align-items: center;
  display: flex;
  gap: 20px;
  justify-content: space-between;
  margin-bottom: 24px;
}

.content-list h2 {
  color: var(--color-primary);
  font-size: 1.6rem;
  letter-spacing: 0;
  line-height: 1.15;
  margin: 0;
}

.content-list__body {
  display: grid;
  gap: 14px;
}

@media (max-width: 700px) {
  .content-list header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
