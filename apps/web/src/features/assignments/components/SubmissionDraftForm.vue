<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { Submission } from '../api/assignments.api'
import { buildUpdateSubmissionPayload, type SubmissionEditorFile, type SubmissionEditorSubmission } from '../lib/submission-form'
import { formatFileSize, normalizeOptionalText } from '../lib/assignments.ui'
import SubmissionStatusBadge from './SubmissionStatusBadge.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import AppTextarea from '../../../shared/ui/AppTextarea.vue'

const props = withDefaults(
  defineProps<{
    submission: Submission
    isBusy?: boolean
    submitError?: string
    cancelTo?: RouteLocationRaw
    disabled?: boolean
  }>(),
  {
    isBusy: false,
    submitError: '',
    cancelTo: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  submit: [payload: SubmissionEditorSubmission]
}>()

const text = ref('')
const keptFiles = ref<SubmissionEditorFile[]>([])
const newFiles = ref<File[]>([])

watch(
  () => props.submission.id,
  () => {
    text.value = normalizeOptionalText(props.submission.text)
    keptFiles.value = [...props.submission.files]
    newFiles.value = []
  },
  {
    immediate: true,
  },
)

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  const selectedFiles = Array.from(input.files ?? [])

  if (selectedFiles.length === 0) {
    return
  }

  const knownFileKeys = new Set(newFiles.value.map((file) => buildLocalFileKey(file)))

  for (const file of selectedFiles) {
    const fileKey = buildLocalFileKey(file)

    if (knownFileKeys.has(fileKey)) {
      continue
    }

    knownFileKeys.add(fileKey)
    newFiles.value.push(file)
  }

  input.value = ''
}

function removeAttachedFile(fileId: string) {
  keptFiles.value = keptFiles.value.filter((file) => file.id !== fileId)
}

function removeNewFile(fileKey: string) {
  newFiles.value = newFiles.value.filter((file) => buildLocalFileKey(file) !== fileKey)
}

function submit(action: 'draft' | 'submit') {
  if (props.disabled || props.isBusy) {
    return
  }

  emit('submit', {
    action,
    text: text.value,
    keptFiles: keptFiles.value,
    newFiles: newFiles.value,
  })
}

function buildLocalFileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

defineExpose({
  buildUpdateSubmissionPayload,
})
</script>

<template>
  <div class="section-grid">
    <AppCard class="span-8 submission-form__card">
      <div class="submission-form__header">
        <div>
          <h2 class="submission-form__title">Моя текущая работа</h2>
          <p class="muted">
            Черновик можно дополнять частями: текст и вложения сохраняются отдельно от финальной отправки.
          </p>
        </div>

        <SubmissionStatusBadge :status="submission.status" />
      </div>

      <AppTextarea
        v-model="text"
        label="Текст работы"
        placeholder="Опишите решение, приложите ссылки или зафиксируйте промежуточный прогресс."
        hint="Пустой черновик допустим. Главное — сохранить попытку как рабочее состояние."
        :disabled="disabled || isBusy"
      />
    </AppCard>

    <AppCard tone="accent" class="span-4 submission-form__card submission-form__actions-card">
      <div class="submission-form__header">
        <div>
          <h2 class="submission-form__title">Действия с попыткой</h2>
          <p class="muted">
            После `Отправить` попытка становится read-only. Новая попытка создаётся уже из assignment detail.
          </p>
        </div>
      </div>

      <div class="submission-form__actions">
        <AppButton variant="secondary" block :disabled="disabled || isBusy" @click="submit('draft')">
          Сохранить черновик
        </AppButton>
        <AppButton block :disabled="disabled || isBusy" @click="submit('submit')">Отправить</AppButton>
        <AppButton v-if="cancelTo" :to="cancelTo" variant="secondary" block>Назад к заданию</AppButton>
      </div>

      <p v-if="submitError" class="submission-form__submit-error">{{ submitError }}</p>
    </AppCard>

    <AppCard class="span-8 submission-form__card">
      <div class="submission-form__header">
        <div>
          <h2 class="submission-form__title">Файлы попытки</h2>
          <p class="muted">Файлы загружаются только при явном сохранении черновика или отправке попытки.</p>
        </div>
      </div>

      <label class="submission-form__upload">
        <span class="submission-form__upload-label">Добавить файлы</span>
        <input type="file" multiple :disabled="disabled || isBusy" @change="handleFileSelection" />
      </label>

      <div v-if="keptFiles.length > 0" class="submission-form__attachments">
        <h3 class="submission-form__subheading">Текущие вложения</h3>

        <ul class="submission-form__file-list">
          <li v-for="file in keptFiles" :key="file.id" class="submission-form__file-item">
            <div class="submission-form__file-copy">
              <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
              <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
            </div>

            <button
              type="button"
              class="submission-form__remove-button"
              :disabled="disabled || isBusy"
              @click="removeAttachedFile(file.id)"
            >
              Убрать
            </button>
          </li>
        </ul>
      </div>

      <div v-if="newFiles.length > 0" class="submission-form__attachments">
        <h3 class="submission-form__subheading">Новые файлы</h3>

        <ul class="submission-form__file-list">
          <li v-for="file in newFiles" :key="buildLocalFileKey(file)" class="submission-form__file-item">
            <div class="submission-form__file-copy">
              <strong>{{ file.name }}</strong>
              <span class="muted">{{ formatFileSize(file.size) }}</span>
            </div>

            <button
              type="button"
              class="submission-form__remove-button"
              :disabled="disabled || isBusy"
              @click="removeNewFile(buildLocalFileKey(file))"
            >
              Убрать
            </button>
          </li>
        </ul>
      </div>

      <p v-if="keptFiles.length === 0 && newFiles.length === 0" class="muted">
        Во вложениях пока пусто. Это допустимо: submission может состоять только из текста.
      </p>
    </AppCard>

    <AppCard class="span-4 submission-form__card">
      <div class="submission-form__header">
        <div>
          <h2 class="submission-form__title">Ориентиры попытки</h2>
        </div>
      </div>

      <ul class="list-copy">
        <li>У задания может быть только один актуальный `DRAFT`, поэтому работа всегда продолжается в одном месте.</li>
        <li>После отправки предыдущая попытка не теряется и остаётся в истории assignment detail.</li>
        <li>Review и feedback происходят уже после перехода из `SUBMITTED` в `REVIEWED`.</li>
      </ul>
    </AppCard>
  </div>
</template>

<style scoped>
.submission-form__card {
  gap: 1.2rem;
}

.submission-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.submission-form__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.submission-form__actions-card {
  align-content: start;
}

.submission-form__actions {
  display: grid;
  gap: 0.75rem;
}

.submission-form__submit-error {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-sm);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.submission-form__upload {
  display: grid;
  gap: 0.6rem;
  padding: 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.58);
}

.submission-form__upload-label {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.submission-form__attachments {
  display: grid;
  gap: 0.75rem;
}

.submission-form__subheading {
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}

.submission-form__file-list {
  display: grid;
  gap: 0.7rem;
}

.submission-form__file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.78);
}

.submission-form__file-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.submission-form__file-copy a,
.submission-form__file-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.submission-form__remove-button {
  color: var(--color-danger);
  font-weight: 700;
}

@media (max-width: 900px) {
  .submission-form__file-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
