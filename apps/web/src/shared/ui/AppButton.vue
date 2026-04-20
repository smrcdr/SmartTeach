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
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    block: false,
    disabled: false,
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
  props.disabled ? 'app-button--disabled' : '',
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
    disabled: props.disabled,
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
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.1;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.app-button--primary {
  background: var(--color-accent-strong);
  color: #ffffff;
}

.app-button--secondary {
  background: #f9fbfd;
  border-color: #c6d3df;
  color: #334155;
}

.app-button--ghost {
  background: #ffffff;
  border-color: #c6d3df;
  color: #60758d;
}

.app-button--sm {
  min-height: 38px;
  padding: 8px 12px;
  font-size: 0.82rem;
}

.app-button:focus-visible {
  outline: 3px solid rgba(var(--color-accent-rgb), 0.18);
  outline-offset: 2px;
}

.app-button--block {
  width: 100%;
}

.app-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
