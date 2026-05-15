<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'split'
}>()
</script>

<template>
  <header :class="['page-header', align === 'split' && 'page-header--split']">
    <div>
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="description" class="lead page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  margin-bottom: clamp(36px, 6vw, 68px);
}

.page-header--split {
  align-items: end;
  display: flex;
  gap: 32px;
  justify-content: space-between;
}

.page-header__description {
  margin-top: 18px;
}

.page-header__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .page-header--split {
    align-items: stretch;
    flex-direction: column;
  }

  .page-header__actions {
    justify-content: flex-start;
  }
}
</style>
