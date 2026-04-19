<script setup lang="ts">
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'

defineProps<{
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  nextStep: string
  primaryActionLabel?: string
  primaryActionTo?: string
}>()
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">{{ eyebrow }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-lead">{{ description }}</p>
    </header>

    <div class="section-grid">
      <AppCard class="span-8">
        <h2 class="section-title">Что уже закреплено в каркасе</h2>
        <ul class="list-copy">
          <li v-for="item in highlights" :key="item">{{ item }}</li>
        </ul>
      </AppCard>

      <AppCard tone="accent" class="span-4">
        <h2 class="section-title">Следующий этап</h2>
        <p class="muted">{{ nextStep }}</p>
        <AppButton v-if="primaryActionLabel && primaryActionTo" :to="primaryActionTo" variant="secondary">
          {{ primaryActionLabel }}
        </AppButton>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
</style>
