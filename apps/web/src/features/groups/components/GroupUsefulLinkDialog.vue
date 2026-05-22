<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Upload, X } from 'lucide-vue-next'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'

export type UsefulLinkDraft = {
  title: string
  url: string
  imageFile: File | null
}

const props = withDefaults(defineProps<{
  open: boolean
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
  initialTitle?: string
  initialUrl?: string
}>(), {
  isSubmitting: false,
  mode: 'create',
  initialTitle: '',
  initialUrl: ''
})

const emit = defineEmits<{
  close: []
  submit: [payload: UsefulLinkDraft]
}>()

const notifications = useNotificationStore()
const imageInput = ref<HTMLInputElement | null>(null)
const form = reactive<UsefulLinkDraft>({
  title: '',
  url: '',
  imageFile: null
})
const dialogTitle = computed(() => props.mode === 'edit' ? 'Редактировать ссылку' : 'Добавить ссылку')
const submitLabel = computed(() => {
  if (props.isSubmitting) {
    return props.mode === 'edit' ? 'Сохраняем...' : 'Добавляем...'
  }

  return props.mode === 'edit' ? 'Сохранить' : 'Добавить ссылку'
})

function resetForm() {
  form.title = ''
  form.url = ''
  form.imageFile = null

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function closeDialog() {
  if (props.isSubmitting) {
    return
  }

  emit('close')
  resetForm()
}

function handleImageChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null

  if (file && !file.type.startsWith('image/')) {
    notifications.error('Для полезной ссылки можно прикрепить только изображение')

    if (imageInput.value) {
      imageInput.value.value = ''
    }

    form.imageFile = null
    return
  }

  form.imageFile = file
}

function validateForm() {
  if (form.title.trim().length === 0) {
    notifications.error('Укажите текст ссылки')
    return false
  }

  try {
    const url = new URL(form.url.trim())

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol')
    }
  } catch {
    notifications.error('Укажите корректную ссылку')
    return false
  }

  return true
}

function submit() {
  if (props.isSubmitting || !validateForm()) {
    return
  }

  emit('submit', {
    title: form.title.trim(),
    url: form.url.trim(),
    imageFile: props.mode === 'edit' ? null : form.imageFile
  })
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    resetForm()
    return
  }

  form.title = props.initialTitle
  form.url = props.initialUrl
  form.imageFile = null

  if (imageInput.value) {
    imageInput.value.value = ''
  }
})
</script>

<template>
  <div v-if="open" class="link-dialog" @click.self="closeDialog">
    <form
      class="link-dialog__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-dialog-title"
      @submit.prevent="submit"
    >
      <header class="link-dialog__header">
        <div>
          <span class="eyebrow">Полезная ссылка</span>
          <h2 id="link-dialog-title">{{ dialogTitle }}</h2>
        </div>
        <button class="link-dialog__close" type="button" aria-label="Закрыть" @click="closeDialog">
          <X :size="18" />
        </button>
      </header>

      <AppTextField v-model="form.title" name="title" label="Текст" placeholder="Например: Телеграм" />
      <AppTextField v-model="form.url" name="url" label="Ссылка" placeholder="https://t.me/test123" />

      <label v-if="mode === 'create'" class="link-dialog__file">
        <span>
          <Upload :size="18" />
          Картинка
        </span>
        <strong>{{ form.imageFile?.name ?? 'Выберите изображение' }}</strong>
        <input ref="imageInput" type="file" accept="image/*" @change="handleImageChange">
      </label>

      <div class="link-dialog__actions">
        <AppButton type="submit" size="lg" :disabled="isSubmitting">
          {{ submitLabel }}
        </AppButton>
        <AppButton type="button" variant="quiet" size="lg" :disabled="isSubmitting" @click="closeDialog">
          Отмена
        </AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.link-dialog {
  align-items: center;
  background: rgb(0 0 0 / 38%);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 24px;
  position: fixed;
  z-index: 70;
}

.link-dialog__panel {
  background: var(--color-surface-lowest);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 18px;
  max-width: 540px;
  padding: clamp(22px, 4vw, 34px);
  width: min(100%, 540px);
}

.link-dialog__header,
.link-dialog__actions {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.link-dialog__header h2 {
  color: var(--color-primary);
  font-size: 1.45rem;
  margin: 6px 0 0;
}

.link-dialog__close {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.link-dialog__file {
  background: var(--color-surface-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: grid;
  gap: 8px;
  padding: 16px;
}

.link-dialog__file span {
  align-items: center;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 8px;
  text-transform: uppercase;
}

.link-dialog__file strong {
  color: var(--color-primary);
  font-size: 0.95rem;
}

.link-dialog__file input {
  display: none;
}

.link-dialog__actions {
  justify-content: flex-start;
  margin-top: 4px;
}

@media (max-width: 640px) {
  .link-dialog__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
