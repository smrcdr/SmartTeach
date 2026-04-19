<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

import AppCard from '../../../shared/ui/AppCard.vue'

const props = withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    description: string
    alternateLabel: string
    alternateActionLabel: string
    alternateTo: RouteLocationRaw
    asideTone?: 'default' | 'muted' | 'accent'
  }>(),
  {
    asideTone: 'muted',
  },
)
</script>

<template>
  <section class="auth-shell">
    <AppCard class="auth-shell__main">
      <div class="auth-shell__header">
        <span class="page-eyebrow">{{ props.eyebrow }}</span>
        <h1 class="page-title">{{ props.title }}</h1>
        <p class="page-lead">{{ props.description }}</p>
      </div>

      <slot />

      <p class="auth-shell__alternate">
        <span>{{ props.alternateLabel }}</span>
        <RouterLink :to="props.alternateTo" class="auth-shell__alternate-link">
          {{ props.alternateActionLabel }}
        </RouterLink>
      </p>

      <slot name="meta" />
    </AppCard>

    <AppCard :tone="props.asideTone" class="auth-shell__aside">
      <slot name="aside" />
    </AppCard>
  </section>
</template>

<style scoped>
.auth-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.92fr);
  gap: 1rem;
  align-items: stretch;
}

.auth-shell__main,
.auth-shell__aside {
  display: grid;
  gap: 1.25rem;
  align-content: start;
}

.auth-shell__header {
  display: grid;
  gap: 0.75rem;
}

.auth-shell__alternate {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  color: var(--color-subtle);
  font-size: 0.95rem;
}

.auth-shell__alternate-link {
  font-weight: 800;
  color: var(--color-accent-strong);
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
}
</style>
