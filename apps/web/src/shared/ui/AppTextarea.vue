<script setup lang="ts">
defineProps<{
  name?: string
  modelValue?: string
  label?: string
  placeholder?: string
  rows?: number
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="textarea">
    <span v-if="label" class="textarea__label">{{ label }}</span>
    <textarea
      :name="name"
      class="textarea__control"
      :rows="rows ?? 5"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </label>
</template>

<style scoped>
.textarea {
  display: grid;
  gap: 8px;
}

.textarea__label {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.textarea__control {
  background: var(--color-surface-low);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  min-height: 132px;
  outline: none;
  padding: 14px 16px;
  resize: vertical;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  width: 100%;
}

.textarea__control:focus {
  background: var(--color-surface-highest);
  border-color: rgb(21 25 108 / 22%);
  box-shadow: 0 0 0 4px rgb(21 25 108 / 10%);
}
</style>
