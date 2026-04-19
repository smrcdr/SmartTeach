<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppButton from '../../../shared/ui/AppButton.vue'
import AppInput from '../../../shared/ui/AppInput.vue'

const props = defineProps<{
  open: boolean
  isBusy: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  close: []
  submit: [title: string]
}>()

const title = ref('')
const titleError = ref('')

const isDisabled = computed(() => props.isBusy)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      title.value = ''
      titleError.value = ''
    }
  },
)

function closeDialog() {
  if (props.isBusy) {
    return
  }

  emit('close')
}

function handleSubmit() {
  const normalizedTitle = title.value.trim()

  if (normalizedTitle.length < 2) {
    titleError.value = 'Название должно содержать минимум 2 символа.'
    return
  }

  titleError.value = ''
  emit('submit', normalizedTitle)
}
</script>

<template>
  <transition name="dialog-fade">
    <div v-if="open" class="group-chat-dialog">
      <button type="button" class="group-chat-dialog__backdrop" aria-label="Закрыть окно" @click="closeDialog" />

      <div class="group-chat-dialog__panel">
        <div class="group-chat-dialog__header">
          <div>
            <span class="page-eyebrow">Групповой чат</span>
            <h2 class="group-chat-dialog__title">Создать новую комнату</h2>
          </div>

          <button type="button" class="group-chat-dialog__close" @click="closeDialog">Закрыть</button>
        </div>

        <AppInput
          v-model="title"
          label="Название чата"
          placeholder="Например, Организационные вопросы"
          :error="titleError"
          :disabled="isDisabled"
        />

        <p v-if="errorMessage" class="group-chat-dialog__error">{{ errorMessage }}</p>

        <div class="group-chat-dialog__actions">
          <AppButton variant="secondary" :disabled="isDisabled" @click="closeDialog">Отмена</AppButton>
          <AppButton :disabled="isDisabled" @click="handleSubmit">
            {{ isBusy ? 'Создаем...' : 'Создать чат' }}
          </AppButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.group-chat-dialog {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.group-chat-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 32, 51, 0.38);
}

.group-chat-dialog__panel {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1.25rem;
  width: min(100%, 28rem);
  padding: 1.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 32px 64px rgba(20, 32, 51, 0.22);
}

.group-chat-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.group-chat-dialog__title {
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.group-chat-dialog__close {
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-subtle);
  cursor: pointer;
}

.group-chat-dialog__error {
  padding: 0.9rem 1rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-sm);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.group-chat-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 180ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .group-chat-dialog {
    padding: 1rem;
  }

  .group-chat-dialog__actions {
    flex-direction: column-reverse;
  }
}
</style>
