<script setup lang="ts">
defineProps<{
  id?: string
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="field">
    <span v-if="label" class="field__label">{{ label }}</span>
    <input
      :id="id"
      class="field__control"
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<style scoped>
.field {
  display: grid;
  gap: 8px;
}

.field__label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field__control {
  background: var(--color-surface-low);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  min-height: 48px;
  outline: none;
  padding: 0 16px;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  width: 100%;
}

.field__control::placeholder {
  color: rgb(70 70 81 / 60%);
}

.field__control:focus {
  background: var(--color-surface-highest);
  border-color: rgb(21 25 108 / 22%);
  box-shadow: 0 0 0 4px rgb(21 25 108 / 10%);
}
</style>
