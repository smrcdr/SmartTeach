<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { Lesson } from '../api/lessons.api'
import {
  getLessonDateValidationMessage,
  isoToLocalDateTimeValue,
  type LessonEditorAction,
  type LessonEditorFile,
  type LessonEditorSubmission,
} from '../lib/lesson-form'
import { formatFileSize, normalizeOptionalText } from '../lib/lessons.ui'
import LessonStatusBadge from './LessonStatusBadge.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import AppInput from '../../../shared/ui/AppInput.vue'
import AppTextarea from '../../../shared/ui/AppTextarea.vue'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    lesson?: Lesson | null
    isBusy?: boolean
    submitError?: string
    cancelTo?: RouteLocationRaw
    disabled?: boolean
  }>(),
  {
    lesson: null,
    isBusy: false,
    submitError: '',
    cancelTo: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  submit: [payload: LessonEditorSubmission]
}>()

const title = ref('')
const content = ref('')
const startsAt = ref('')
const endsAt = ref('')
const keptFiles = ref<LessonEditorFile[]>([])
const newFiles = ref<File[]>([])
const titleError = ref('')
const dateError = ref('')

const fileInputHint = computed(() =>
  props.mode === 'create'
    ? 'Можно приложить материалы сразу: новые файлы загрузятся только после сохранения урока.'
    : 'Можно убрать старые вложения и добавить новые. Фактическая загрузка произойдёт при сохранении.',
)
const sectionLead = computed(() =>
  props.mode === 'create'
    ? 'Форма создаёт урок как полноценную страницу, а не как модалку. Дата остаётся необязательной метаинформацией.'
    : 'Редактирование отделено от списка уроков: здесь меняются контент, статус, даты, вложения и итоговый порядок.',
)

watch(
  () => props.lesson?.id ?? props.mode,
  () => {
    title.value = props.lesson?.title ?? ''
    content.value = normalizeOptionalText(props.lesson?.content)
    startsAt.value = isoToLocalDateTimeValue(props.lesson?.startsAt)
    endsAt.value = isoToLocalDateTimeValue(props.lesson?.endsAt)
    keptFiles.value = [...(props.lesson?.files ?? [])]
    newFiles.value = []
    titleError.value = ''
    dateError.value = ''
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

function submit(action: LessonEditorAction) {
  if (props.disabled || props.isBusy) {
    return
  }

  titleError.value = ''
  dateError.value = ''

  const normalizedTitle = title.value.trim()

  if (normalizedTitle.length < 2) {
    titleError.value = 'Название урока должно быть не короче 2 символов.'
  }

  if (normalizedTitle.length > 200) {
    titleError.value = 'Название урока должно быть не длиннее 200 символов.'
  }

  dateError.value = getLessonDateValidationMessage(startsAt.value, endsAt.value)

  if (titleError.value || dateError.value) {
    return
  }

  emit('submit', {
    action,
    title: normalizedTitle,
    content: content.value,
    startsAt: startsAt.value,
    endsAt: endsAt.value,
    keptFiles: keptFiles.value,
    newFiles: newFiles.value,
  })
}

function buildLocalFileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}
</script>

<template>
  <div class="section-grid">
    <AppCard class="span-8 lesson-form__card">
      <div class="lesson-form__header">
        <div>
          <h2 class="lesson-form__title">
            {{ mode === 'create' ? 'Контент урока' : 'Редактирование урока' }}
          </h2>
          <p class="muted">{{ sectionLead }}</p>
        </div>

        <LessonStatusBadge v-if="lesson" :status="lesson.status" />
      </div>

      <div class="form-grid">
        <AppInput
          v-model="title"
          class="span-full"
          label="Название"
          placeholder="Например, Intro to REST contracts"
          :error="titleError"
          :disabled="disabled || isBusy"
        />

        <AppInput
          v-model="startsAt"
          label="Начало"
          type="datetime-local"
          hint="Необязательное поле. Можно оставить урок без даты."
          :error="dateError"
          :disabled="disabled || isBusy"
        />

        <AppInput
          v-model="endsAt"
          label="Окончание"
          type="datetime-local"
          hint="Можно указать только начало или не указывать время вовсе."
          :error="dateError"
          :disabled="disabled || isBusy"
        />

        <AppTextarea
          v-model="content"
          class="span-full"
          label="Содержание"
          placeholder="Краткий конспект, домашняя подготовка, ссылки на материалы и шаги урока."
          hint="Пустое поле допустимо: урок можно сохранить сначала как лёгкую структурную запись."
          :disabled="disabled || isBusy"
        />
      </div>
    </AppCard>

    <AppCard tone="accent" class="span-4 lesson-form__card lesson-form__actions-card">
      <div class="lesson-form__header">
        <div>
          <h2 class="lesson-form__title">Явные действия</h2>
          <p class="muted">У статуса нет неявной магии: черновик, публикация и архивирование вынесены в отдельные CTA.</p>
        </div>
      </div>

      <div class="lesson-form__actions">
        <AppButton variant="secondary" block :disabled="disabled || isBusy" @click="submit('draft')">
          Сохранить черновик
        </AppButton>
        <AppButton block :disabled="disabled || isBusy" @click="submit('publish')">
          Опубликовать
        </AppButton>
        <AppButton
          v-if="mode === 'edit'"
          variant="ghost"
          block
          :disabled="disabled || isBusy"
          @click="submit('archive')"
        >
          Архивировать
        </AppButton>
        <AppButton v-if="cancelTo" :to="cancelTo" variant="secondary" block>
          Отмена
        </AppButton>
      </div>

      <p v-if="submitError" class="lesson-form__submit-error">{{ submitError }}</p>
    </AppCard>

    <AppCard class="span-8 lesson-form__card">
      <div class="lesson-form__header">
        <div>
          <h2 class="lesson-form__title">Файлы урока</h2>
          <p class="muted">{{ fileInputHint }}</p>
        </div>
      </div>

      <label class="lesson-form__upload">
        <span class="lesson-form__upload-label">Добавить файлы</span>
        <input type="file" multiple :disabled="disabled || isBusy" @change="handleFileSelection" />
      </label>

      <div v-if="keptFiles.length > 0" class="lesson-form__attachments">
        <h3 class="lesson-form__subheading">Текущие вложения</h3>

        <ul class="lesson-form__file-list">
          <li v-for="file in keptFiles" :key="file.id" class="lesson-form__file-item">
            <div class="lesson-form__file-copy">
              <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
              <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
            </div>

            <button
              type="button"
              class="lesson-form__remove-button"
              :disabled="disabled || isBusy"
              @click="removeAttachedFile(file.id)"
            >
              Убрать
            </button>
          </li>
        </ul>
      </div>

      <div v-if="newFiles.length > 0" class="lesson-form__attachments">
        <h3 class="lesson-form__subheading">Новые файлы</h3>

        <ul class="lesson-form__file-list">
          <li v-for="file in newFiles" :key="buildLocalFileKey(file)" class="lesson-form__file-item">
            <div class="lesson-form__file-copy">
              <strong>{{ file.name }}</strong>
              <span class="muted">{{ formatFileSize(file.size) }}</span>
            </div>

            <button
              type="button"
              class="lesson-form__remove-button"
              :disabled="disabled || isBusy"
              @click="removeNewFile(buildLocalFileKey(file))"
            >
              Убрать
            </button>
          </li>
        </ul>
      </div>

      <p v-if="keptFiles.length === 0 && newFiles.length === 0" class="muted">
        В урок пока не добавлены материалы. Это нормально: вложения можно оставить на следующий проход.
      </p>
    </AppCard>

    <AppCard class="span-4 lesson-form__card">
      <div class="lesson-form__header">
        <div>
          <h2 class="lesson-form__title">Ориентиры формы</h2>
        </div>
      </div>

      <ul class="list-copy">
        <li>Дата остаётся метаданными: список уроков всё равно строится по ручному порядку.</li>
        <li>Поля `startsAt` и `endsAt` можно полностью очистить, чтобы вернуть урок в состояние без слота.</li>
        <li>Файлы привязываются к уроку только после явного сохранения выбранного действия.</li>
      </ul>
    </AppCard>
  </div>
</template>

<style scoped>
.lesson-form__card {
  gap: 1.2rem;
}

.lesson-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lesson-form__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.lesson-form__actions-card {
  align-content: start;
}

.lesson-form__actions {
  display: grid;
  gap: 0.75rem;
}

.lesson-form__submit-error {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-sm);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.lesson-form__upload {
  display: grid;
  gap: 0.6rem;
  padding: 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.58);
}

.lesson-form__upload-label {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.lesson-form__attachments {
  display: grid;
  gap: 0.75rem;
}

.lesson-form__subheading {
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.lesson-form__file-list {
  display: grid;
  gap: 0.75rem;
}

.lesson-form__file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.6);
}

.lesson-form__file-copy {
  display: grid;
  gap: 0.28rem;
  min-width: 0;
}

.lesson-form__file-copy a,
.lesson-form__file-copy strong {
  overflow-wrap: anywhere;
}

.lesson-form__remove-button {
  flex-shrink: 0;
  color: var(--color-danger);
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 720px) {
  .lesson-form__header,
  .lesson-form__file-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
