<script setup lang="ts">
defineProps<{
  name: string
  label: string
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label class="group-module-switch">
    <span class="group-module-switch__label">{{ label }}</span>
    <input
      class="group-module-switch__input"
      type="checkbox"
      :name="name"
      :checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="group-module-switch__track" aria-hidden="true">
      <span class="group-module-switch__thumb"></span>
    </span>
  </label>
</template>

<style scoped>
.group-module-switch {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 64px;
  padding: 14px 16px;
}

.group-module-switch__label {
  color: var(--color-text);
  font-size: 0.94rem;
  font-weight: 760;
}

.group-module-switch__input {
  height: 1px;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  width: 1px;
}

.group-module-switch__track {
  align-items: center;
  background: var(--color-switch-off-bg);
  border: 1px solid var(--color-switch-off-border);
  border-radius: 999px;
  display: inline-flex;
  height: 32px;
  padding: 3px;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  width: 56px;
}

.group-module-switch__thumb {
  background: var(--color-surface-lowest);
  border-radius: 999px;
  box-shadow: 0 5px 12px rgb(27 27 32 / 18%);
  height: 24px;
  transform: translateX(0);
  transition: transform 180ms ease, background-color 160ms ease;
  width: 24px;
}

.group-module-switch__input:checked + .group-module-switch__track {
  background: var(--color-action-primary-bg);
  border-color: var(--color-primary-container);
}

.group-module-switch__input:checked + .group-module-switch__track .group-module-switch__thumb {
  transform: translateX(24px);
}

.group-module-switch__input:focus-visible + .group-module-switch__track {
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}
</style>
