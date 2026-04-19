<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    href?: string
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'md' | 'sm'
    type?: 'button' | 'submit' | 'reset'
    block?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    block: false,
  },
)

const component = computed(() => {
  if (props.to) {
    return RouterLink
  }

  if (props.href) {
    return 'a'
  }

  return 'button'
})

const buttonClass = computed(() => [
  'app-button',
  `app-button--${props.variant}`,
  `app-button--${props.size}`,
  props.block ? 'app-button--block' : '',
])

const componentProps = computed(() => {
  if (props.to) {
    return {
      to: props.to,
    }
  }

  if (props.href) {
    return {
      href: props.href,
    }
  }

  return {
    type: props.type,
  }
})
</script>

<template>
  <component :is="component" :class="buttonClass" v-bind="componentProps">
    <slot />
  </component>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.9rem;
  padding: 0.72rem 1.1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.app-button:hover {
  transform: translateY(-1px);
}

.app-button--primary {
  background: var(--color-text);
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(20, 32, 51, 0.16);
}

.app-button--secondary {
  background: var(--color-panel);
  border-color: var(--color-border);
  color: var(--color-text);
}

.app-button--ghost {
  background: transparent;
  border-color: rgba(31, 117, 156, 0.16);
  color: var(--color-accent-strong);
}

.app-button--sm {
  min-height: 2.45rem;
  padding: 0.55rem 0.9rem;
  font-size: 0.92rem;
}

.app-button--block {
  width: 100%;
}
</style>
