<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    label?: string
    modelValue?: string
    hint?: string
    error?: string
  }>(),
  {
    modelValue: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const message = computed(() => props.error ?? props.hint ?? '')

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <label class="field">
    <span v-if="label" class="field__label">{{ label }}</span>
    <input
      v-bind="attrs"
      :value="modelValue"
      :class="['field__control', { 'field__control--error': Boolean(error) }]"
      @input="onInput"
    />
    <span v-if="message" :class="['field__message', { 'field__message--error': Boolean(error) }]">
      {{ message }}
    </span>
  </label>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.45rem;
}

.field__label {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
}

.field__control {
  width: 100%;
  min-height: 3.1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-panel);
  color: var(--color-text);
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.field__control:focus {
  border-color: rgba(31, 117, 156, 0.44);
  box-shadow: 0 0 0 4px rgba(31, 117, 156, 0.1);
}

.field__control--error {
  border-color: rgba(156, 71, 71, 0.5);
}

.field__message {
  font-size: 0.88rem;
  color: var(--color-subtle);
}

.field__message--error {
  color: var(--color-danger);
}
</style>
