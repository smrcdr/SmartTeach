<script setup lang="ts">
import type { Group } from '../api/groups.api'

type AccessMode = Group['accessMode']

defineProps<{
  name: string
  modelValue: AccessMode
}>()

defineEmits<{
  'update:modelValue': [value: AccessMode]
}>()

const accessModes: Array<{ value: AccessMode, label: string }> = [
  { value: 'OPEN', label: 'Открытая' },
  { value: 'BY_REQUEST', label: 'По заявке' },
  { value: 'CLOSED', label: 'Закрытая' }
]
</script>

<template>
  <fieldset class="group-access-mode">
    <legend>Доступ</legend>
    <div class="group-access-mode__options">
      <label
        v-for="mode in accessModes"
        :key="mode.value"
        :class="['group-access-mode__option', { 'group-access-mode__option--active': modelValue === mode.value }]"
      >
        <input
          type="radio"
          :name="name"
          :value="mode.value"
          :checked="modelValue === mode.value"
          @change="$emit('update:modelValue', mode.value)"
        />
        <span>{{ mode.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.group-access-mode {
  border: 0;
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
}

.group-access-mode legend {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0;
  text-transform: uppercase;
}

.group-access-mode__options {
  background: var(--color-surface-low);
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 6px;
}

.group-access-mode__option {
  align-items: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  font-size: 0.9rem;
  font-weight: 760;
  justify-content: center;
  min-height: 42px;
  padding: 0 12px;
  text-align: center;
  transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.group-access-mode__option input {
  height: 1px;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  width: 1px;
}

.group-access-mode__option:hover {
  background: var(--color-menu-hover);
  color: var(--color-text);
}

.group-access-mode__option--active {
  background: var(--color-action-primary-bg);
  box-shadow: var(--shadow-action-primary);
  color: var(--color-action-primary-text);
}

.group-access-mode__option:has(input:focus-visible) {
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

@media (max-width: 640px) {
  .group-access-mode__options {
    grid-template-columns: 1fr;
  }
}
</style>
