<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'tertiary' | 'quiet'
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  iconOnly: false,
  ariaLabel: undefined,
  type: 'button',
  disabled: false
})

const classes = computed(() => [
  'app-button',
  `app-button--${props.variant}`,
  `app-button--${props.size}`,
  { 'app-button--icon-only': props.iconOnly }
])
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :aria-label="ariaLabel"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  align-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  font-weight: 750;
  gap: 10px;
  justify-content: center;
  letter-spacing: 0;
  line-height: 1;
  min-height: 42px;
  transition: background-color 160ms ease, box-shadow 160ms ease, color 160ms ease, transform 160ms ease;
  white-space: nowrap;
}

.app-button:hover {
  transform: translateY(-1px);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
  transform: none;
}

.app-button:disabled:hover {
  transform: none;
}

.app-button:active {
  transform: translateY(0) scale(0.98);
}

.app-button:focus-visible {
  outline: 3px solid var(--color-focus-border);
  outline-offset: 3px;
}

.app-button--primary {
  background: var(--color-action-primary-bg);
  border-color: color-mix(in srgb, var(--color-primary-container) 46%, transparent);
  box-shadow: var(--shadow-action-primary);
  color: var(--color-action-primary-text);
}

.app-button--primary:hover {
  box-shadow: var(--shadow-action-primary-hover);
}

.app-button--secondary {
  background: var(--color-surface-high);
  border-color: var(--color-panel-border);
  color: var(--color-text);
}

.app-button--tertiary {
  background: transparent;
  border-color: var(--color-panel-border);
  color: var(--color-primary);
  font-size: 0.76rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.app-button--quiet {
  background: var(--color-surface-low);
  border-color: var(--color-panel-border);
  color: var(--color-text-muted);
}

.app-button--sm {
  min-height: 34px;
  padding: 0 14px;
}

.app-button--md {
  min-height: 42px;
  padding: 0 20px;
}

.app-button--lg {
  min-height: 50px;
  padding: 0 28px;
}

.app-button--icon-only {
  aspect-ratio: 1;
  border-radius: 50%;
  min-width: 42px;
  padding: 0;
}
</style>
