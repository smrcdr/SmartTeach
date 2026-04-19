<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { Assignment } from '../api/assignments.api'
import {
  isoToLocalDateTimeValue,
  parseOptionalInteger,
  type AssignmentEditorAction,
  type AssignmentEditorFile,
  type AssignmentEditorSubmission,
} from '../lib/assignment-form'
import { formatFileSize, normalizeOptionalText } from '../lib/assignments.ui'
import AssignmentStatusBadge from './AssignmentStatusBadge.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import AppInput from '../../../shared/ui/AppInput.vue'
import AppSelect from '../../../shared/ui/AppSelect.vue'
import AppTextarea from '../../../shared/ui/AppTextarea.vue'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    assignment?: Assignment | null
    lessonOptions: Array<{
      label: string
      value: string
    }>
    lessonHint?: string
    isLessonSelectDisabled?: boolean
    isBusy?: boolean
    submitError?: string
    cancelTo?: RouteLocationRaw
    disabled?: boolean
  }>(),
  {
    assignment: null,
    lessonHint: '',
    isLessonSelectDisabled: false,
    isBusy: false,
    submitError: '',
    cancelTo: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  submit: [payload: AssignmentEditorSubmission]
}>()

const title = ref('')
const content = ref('')
const lessonId = ref('')
const dueAt = ref('')
const maxScore = ref('')
const keptFiles = ref<AssignmentEditorFile[]>([])
const newFiles = ref<File[]>([])
const titleError = ref('')
const dueAtError = ref('')
const maxScoreError = ref('')

const sectionLead = computed(() =>
  props.mode === 'create'
    ? 'Задание создаётся на отдельной странице: можно сохранить черновик, сразу опубликовать или привязать его к уроку позднее.'
    : 'Редактирование вынесено из списка в отдельный full-page flow с явным управлением статусом, дедлайном и вложениями.',
)
const fileInputHint = computed(() =>
  props.mode === 'create'
    ? 'Новые файлы загрузятся только после сохранения задания.'
    : 'Можно убрать старые вложения и добавить новые. Фактическая привязка обновится после сохранения.',
)
const hasImmutableOptionalValues = computed(
  () => props.mode === 'edit' && (Boolean(props.assignment?.dueAt) || props.assignment?.maxScore !== null),
)

watch(
  () => props.assignment?.id ?? props.mode,
  () => {
    title.value = props.assignment?.title ?? ''
    content.value = normalizeOptionalText(props.assignment?.content)
    lessonId.value = props.assignment?.lessonId ?? ''
    dueAt.value = isoToLocalDateTimeValue(props.assignment?.dueAt)
    maxScore.value = props.assignment?.maxScore !== null && props.assignment?.maxScore !== undefined ? String(props.assignment.maxScore) : ''
    keptFiles.value = [...(props.assignment?.files ?? [])]
    newFiles.value = []
    titleError.value = ''
    dueAtError.value = ''
    maxScoreError.value = ''
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

function submit(action: AssignmentEditorAction) {
  if (props.disabled || props.isBusy) {
    return
  }

  titleError.value = ''
  dueAtError.value = ''
  maxScoreError.value = ''

  const normalizedTitle = title.value.trim()
  const normalizedDueAt = normalizeOptionalText(dueAt.value)
  const normalizedMaxScore = maxScore.value.trim()

  if (normalizedTitle.length < 2) {
    titleError.value = 'Название задания должно быть не короче 2 символов.'
  }

  if (normalizedTitle.length > 200) {
    titleError.value = 'Название задания должно быть не длиннее 200 символов.'
  }

  if (props.mode === 'edit' && props.assignment?.dueAt && !normalizedDueAt) {
    dueAtError.value = 'Текущий API не поддерживает очистку уже заданного дедлайна. Укажите новую дату или оставьте текущую.'
  }

  if (normalizedMaxScore) {
    const parsedMaxScore = parseOptionalInteger(normalizedMaxScore)

    if (parsedMaxScore === null) {
      maxScoreError.value = 'Максимальный балл должен быть целым числом не меньше 0.'
    }
  } else if (props.mode === 'edit' && props.assignment?.maxScore !== null) {
    maxScoreError.value =
      'Текущий API не поддерживает очистку уже заданного max score. Укажите новое значение или оставьте текущее.'
  }

  if (titleError.value || dueAtError.value || maxScoreError.value) {
    return
  }

  emit('submit', {
    action,
    title: normalizedTitle,
    content: content.value,
    lessonId: lessonId.value,
    dueAt: dueAt.value,
    maxScore: maxScore.value,
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
    <AppCard class="span-8 assignment-form__card">
      <div class="assignment-form__header">
        <div>
          <h2 class="assignment-form__title">
            {{ mode === 'create' ? 'Контент задания' : 'Редактирование задания' }}
          </h2>
          <p class="muted">{{ sectionLead }}</p>
        </div>

        <AssignmentStatusBadge v-if="assignment" :status="assignment.status" />
      </div>

      <div class="form-grid">
        <AppInput
          v-model="title"
          class="span-full"
          label="Название"
          placeholder="Например, Подготовить разбор API-контракта"
          :error="titleError"
          :disabled="disabled || isBusy"
        />

        <AppSelect
          v-model="lessonId"
          label="Связанный урок"
          :options="lessonOptions"
          :hint="lessonHint"
          :disabled="isLessonSelectDisabled || disabled || isBusy"
        />

        <AppInput
          v-model="dueAt"
          label="Дедлайн"
          type="datetime-local"
          hint="Необязательное поле. Задание можно оставить без срока."
          :error="dueAtError"
          :disabled="disabled || isBusy"
        />

        <AppInput
          v-model="maxScore"
          label="Максимальный балл"
          type="number"
          min="0"
          step="1"
          hint="Необязательное поле. Если оставить пустым, review будет только через feedback."
          :error="maxScoreError"
          :disabled="disabled || isBusy"
        />

        <AppTextarea
          v-model="content"
          class="span-full"
          label="Условие"
          placeholder="Опишите задачу, критерии выполнения, формат ответа и дополнительные ориентиры."
          hint="Текст можно оставить пустым, если задание создаётся как черновой каркас."
          :disabled="disabled || isBusy"
        />
      </div>
    </AppCard>

    <AppCard tone="accent" class="span-4 assignment-form__card assignment-form__actions-card">
      <div class="assignment-form__header">
        <div>
          <h2 class="assignment-form__title">Явные действия</h2>
          <p class="muted">Статус задания меняется только через отдельные CTA, без скрытой логики формы.</p>
        </div>
      </div>

      <div class="assignment-form__actions">
        <AppButton variant="secondary" block :disabled="disabled || isBusy" @click="submit('draft')">
          Сохранить черновик
        </AppButton>
        <AppButton block :disabled="disabled || isBusy" @click="submit('publish')">Опубликовать</AppButton>
        <AppButton
          v-if="mode === 'edit'"
          variant="ghost"
          block
          :disabled="disabled || isBusy"
          @click="submit('archive')"
        >
          Архивировать
        </AppButton>
        <AppButton v-if="cancelTo" :to="cancelTo" variant="secondary" block>Отмена</AppButton>
      </div>

      <p v-if="submitError" class="assignment-form__submit-error">{{ submitError }}</p>
    </AppCard>

    <AppCard class="span-8 assignment-form__card">
      <div class="assignment-form__header">
        <div>
          <h2 class="assignment-form__title">Файлы задания</h2>
          <p class="muted">{{ fileInputHint }}</p>
        </div>
      </div>

      <label class="assignment-form__upload">
        <span class="assignment-form__upload-label">Добавить файлы</span>
        <input type="file" multiple :disabled="disabled || isBusy" @change="handleFileSelection" />
      </label>

      <div v-if="keptFiles.length > 0" class="assignment-form__attachments">
        <h3 class="assignment-form__subheading">Текущие вложения</h3>

        <ul class="assignment-form__file-list">
          <li v-for="file in keptFiles" :key="file.id" class="assignment-form__file-item">
            <div class="assignment-form__file-copy">
              <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
              <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
            </div>

            <button
              type="button"
              class="assignment-form__remove-button"
              :disabled="disabled || isBusy"
              @click="removeAttachedFile(file.id)"
            >
              Убрать
            </button>
          </li>
        </ul>
      </div>

      <div v-if="newFiles.length > 0" class="assignment-form__attachments">
        <h3 class="assignment-form__subheading">Новые файлы</h3>

        <ul class="assignment-form__file-list">
          <li v-for="file in newFiles" :key="buildLocalFileKey(file)" class="assignment-form__file-item">
            <div class="assignment-form__file-copy">
              <strong>{{ file.name }}</strong>
              <span class="muted">{{ formatFileSize(file.size) }}</span>
            </div>

            <button
              type="button"
              class="assignment-form__remove-button"
              :disabled="disabled || isBusy"
              @click="removeNewFile(buildLocalFileKey(file))"
            >
              Убрать
            </button>
          </li>
        </ul>
      </div>

      <p v-if="keptFiles.length === 0 && newFiles.length === 0" class="muted">
        В задание пока не добавлены файлы. Это нормально: вложения можно подключить на следующем проходе.
      </p>
    </AppCard>

    <AppCard class="span-4 assignment-form__card">
      <div class="assignment-form__header">
        <div>
          <h2 class="assignment-form__title">Ориентиры формы</h2>
        </div>
      </div>

      <ul class="list-copy">
        <li>Связь с уроком остаётся опциональной: задание может быть полностью самостоятельным внутри группы.</li>
        <li>Если `maxScore` пустой, review flow работает только через feedback без числовой оценки.</li>
        <li>Файлы привязываются к заданию только после явного сохранения выбранного действия.</li>
      </ul>

      <p v-if="hasImmutableOptionalValues" class="assignment-form__api-note">
        Текущий backend-контракт позволяет изменить `dueAt` и `maxScore`, но не очистить их обратно в `null`.
      </p>
    </AppCard>
  </div>
</template>

<style scoped>
.assignment-form__card {
  gap: 1.2rem;
}

.assignment-form__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.assignment-form__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.assignment-form__actions-card {
  align-content: start;
}

.assignment-form__actions {
  display: grid;
  gap: 0.75rem;
}

.assignment-form__submit-error,
.assignment-form__api-note {
  padding: 0.95rem 1rem;
  border-radius: var(--radius-sm);
}

.assignment-form__submit-error {
  border: 1px solid rgba(156, 71, 71, 0.18);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.assignment-form__api-note {
  border: 1px solid rgba(31, 117, 156, 0.18);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.assignment-form__upload {
  display: grid;
  gap: 0.6rem;
  padding: 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.58);
}

.assignment-form__upload-label {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.assignment-form__attachments {
  display: grid;
  gap: 0.75rem;
}

.assignment-form__subheading {
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}

.assignment-form__file-list {
  display: grid;
  gap: 0.7rem;
}

.assignment-form__file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.78);
}

.assignment-form__file-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.assignment-form__file-copy a,
.assignment-form__file-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.assignment-form__remove-button {
  color: var(--color-danger);
  font-weight: 700;
}

@media (max-width: 900px) {
  .assignment-form__file-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
