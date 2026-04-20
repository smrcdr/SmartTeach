<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

import AppCard from '../../../shared/ui/AppCard.vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    alternateLabel: string
    alternateActionLabel: string
    alternateTo: RouteLocationRaw
    asideTone?: 'default' | 'muted' | 'accent'
  }>(),
  {
    eyebrow: '',
    description: '',
    asideTone: 'muted',
  },
)

const slots = useSlots()
const hasAside = computed(() => Boolean(slots.aside))
</script>

<template>
  <section class="auth-shell" :class="{ 'auth-shell--single': !hasAside }">
    <AppCard class="auth-shell__main">
      <div class="auth-shell__header">
        <span v-if="props.eyebrow" class="page-eyebrow">{{ props.eyebrow }}</span>
        <h1 class="page-title">{{ props.title }}</h1>
        <p v-if="props.description" class="page-lead">{{ props.description }}</p>
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

    <AppCard v-if="hasAside" :tone="props.asideTone" class="auth-shell__aside">
      <slot name="aside" />
    </AppCard>
  </section>
</template>

<style scoped>
.auth-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: 1.25rem;
  align-items: stretch;
}

.auth-shell--single {
  grid-template-columns: minmax(0, 384px);
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.auth-shell__main,
.auth-shell__aside {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.auth-shell__header {
  display: grid;
  gap: 0.4rem;
  justify-items: center;
  text-align: center;
  margin-bottom: 0.6rem;
}

.auth-shell__header .page-title {
  font-size: 1.9rem;
}

.auth-shell__alternate {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  color: var(--color-subtle);
  font-size: 0.84rem;
}

.auth-shell__alternate-link {
  font-weight: 800;
  color: var(--color-accent-strong);
}

.auth-shell__main {
  padding: 0.8rem 1rem 0.95rem;
}

.auth-shell__aside {
  background: linear-gradient(180deg, rgba(var(--color-accent-rgb), 0.08), rgba(var(--color-accent-rgb), 0.04));
}

.auth-shell__main :deep(.field) {
  gap: 6px;
}

.auth-shell__main :deep(.field__label) {
  font-size: 0.76rem;
}

.auth-shell__main :deep(.field__control) {
  min-height: 36px;
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.auth-shell__main :deep(.field__message) {
  font-size: 0.8rem;
}

.auth-shell__main :deep(.app-button) {
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 11px;
  font-size: 0.82rem;
}

@media (max-width: 960px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }

  .auth-shell__main {
    padding: 0.35rem 0.25rem 0.45rem;
  }
}
</style>
