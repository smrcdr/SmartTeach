<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../features/auth/stores/auth.store'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import SubmissionDraftForm from '../../features/assignments/components/SubmissionDraftForm.vue'
import SubmissionStatusBadge from '../../features/assignments/components/SubmissionStatusBadge.vue'
import {
  deleteUploadedFile,
  getAssignmentsErrorMessage,
  uploadSubmissionFiles,
} from '../../features/assignments/api/assignments.api'
import { useAssignment, useSubmission, useUpdateSubmissionMutation } from '../../features/assignments/composables/useAssignments'
import { buildUpdateSubmissionPayload, type SubmissionEditorSubmission } from '../../features/assignments/lib/submission-form'
import {
  formatAssignmentDateTime,
  formatFileSize,
  formatSubmissionScore,
  getSubmissionSummary,
  isAssignmentVisibleToUser,
  normalizeOptionalText,
} from '../../features/assignments/lib/assignments.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'
import AppTextarea from '../../shared/ui/AppTextarea.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))
const submissionId = computed(() => String(route.params.submissionId ?? ''))
const workspace = useGroupWorkspace(groupId)

const assignmentQuery = useAssignment(groupId, assignmentId, {
  enabled: workspace.isMember,
})
const submissionQuery = useSubmission(groupId, assignmentId, submissionId, {
  enabled: workspace.isMember,
})
const updateSubmissionMutation = useUpdateSubmissionMutation(groupId, assignmentId, submissionId)

const isUploading = ref(false)
const submitError = ref('')
const reviewError = ref('')
const reviewScore = ref('')
const reviewFeedback = ref('')
const reviewScoreError = ref('')

const assignment = computed(() => assignmentQuery.data.value ?? null)
const submission = computed(() => submissionQuery.data.value ?? null)
const currentUserId = computed(() => authStore.currentUser?.id ?? '')
const isAssignmentsModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.assignmentsEnabled,
)
const shouldHideAssignment = computed(() => {
  const currentAssignment = assignment.value

  if (!currentAssignment) {
    return false
  }

  return !isAssignmentVisibleToUser(currentAssignment, workspace.canManageGroup.value)
})
const isAuthor = computed(() => submission.value?.authorId === currentUserId.value)
const isDraftEditable = computed(
  () =>
    Boolean(submission.value) &&
    submission.value?.status === 'DRAFT' &&
    isAuthor.value &&
    !workspace.canManageGroup.value &&
    !workspace.isReadOnly.value,
)
const canReviewSubmission = computed(
  () =>
    Boolean(submission.value) &&
    workspace.canManageGroup.value &&
    !workspace.isReadOnly.value &&
    submission.value?.status !== 'DRAFT',
)
const assignmentErrorMessage = computed(() => {
  const error = assignmentQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить задание') : ''
})
const submissionErrorMessage = computed(() => {
  const error = submissionQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить попытку') : ''
})
const isBusy = computed(
  () => assignmentQuery.isPending.value || submissionQuery.isPending.value || updateSubmissionMutation.isPending.value || isUploading.value,
)

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isAssignmentsModuleUnavailable.value) {
    void router.replace({
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    })
  }
})

watchEffect(() => {
  if (!assignmentQuery.isPending.value && shouldHideAssignment.value) {
    void router.replace({
      name: 'group-assignments',
      params: {
        groupId: groupId.value,
      },
    })
  }
})

watch(
  () => submission.value?.id,
  () => {
    reviewScore.value =
      submission.value?.score !== null && submission.value?.score !== undefined ? String(submission.value.score) : ''
    reviewFeedback.value = normalizeOptionalText(submission.value?.feedback)
    reviewScoreError.value = ''
    reviewError.value = ''
  },
  {
    immediate: true,
  },
)

async function handleDraftSubmit(payload: SubmissionEditorSubmission) {
  submitError.value = ''
  isUploading.value = true

  let uploadedFileIds: string[] = []

  try {
    const uploadedFiles = await uploadSubmissionFiles(payload.newFiles)

    uploadedFileIds = uploadedFiles.map((file) => file.id)

    await updateSubmissionMutation.mutateAsync(buildUpdateSubmissionPayload(payload, uploadedFileIds))
  } catch (error) {
    if (uploadedFileIds.length > 0) {
      await Promise.allSettled(uploadedFileIds.map((fileId) => deleteUploadedFile(fileId)))
    }

    submitError.value = getAssignmentsErrorMessage(error, 'Не удалось обновить черновик')
  } finally {
    isUploading.value = false
  }
}

async function handleReviewSubmit() {
  if (!assignment.value || !submission.value) {
    return
  }

  reviewError.value = ''
  reviewScoreError.value = ''

  const normalizedScore = reviewScore.value.trim()
  let nextScore: number | null = null

  if (assignment.value.maxScore !== null) {
    if (!normalizedScore) {
      if (submission.value.score !== null) {
        reviewScoreError.value =
          'Текущий API не поддерживает очистку уже выставленного score. Укажите новое значение или оставьте текущее.'
      }
    } else {
      const parsedScore = Number(normalizedScore)

      if (!Number.isInteger(parsedScore) || parsedScore < 0) {
        reviewScoreError.value = 'Score должен быть целым числом не меньше 0.'
      } else if (parsedScore > assignment.value.maxScore) {
        reviewScoreError.value = `Score не может быть больше ${assignment.value.maxScore}.`
      } else {
        nextScore = parsedScore
      }
    }
  }

  if (reviewScoreError.value) {
    return
  }

  try {
    await updateSubmissionMutation.mutateAsync({
      status: 'REVIEWED',
      feedback: reviewFeedback.value,
      ...(nextScore !== null
        ? {
            score: nextScore,
          }
        : {}),
    })
  } catch (error) {
    reviewError.value = getAssignmentsErrorMessage(error, 'Не удалось сохранить review')
  }
}
</script>

<template>
  <AppLoader
    v-if="assignmentQuery.isPending.value || submissionQuery.isPending.value || shouldHideAssignment || isAssignmentsModuleUnavailable"
    label="Открываем попытку и проверяем доступный режим работы"
  />

  <AppErrorState
    v-else-if="assignmentErrorMessage"
    title="Не удалось открыть задание"
    :description="assignmentErrorMessage"
  >
    <template #actions>
      <AppButton
        variant="secondary"
        :to="{
          name: 'group-assignments',
          params: {
            groupId,
          },
        }"
      >
        Назад к заданиям
      </AppButton>
    </template>
  </AppErrorState>

  <AppErrorState
    v-else-if="submissionErrorMessage"
    title="Не удалось открыть попытку"
    :description="submissionErrorMessage"
  >
    <template #actions>
      <AppButton
        variant="secondary"
        :to="{
          name: 'group-assignment-details',
          params: {
            groupId,
            assignmentId,
          },
        }"
      >
        Назад к заданию
      </AppButton>
    </template>
  </AppErrorState>

  <div v-else-if="assignment && submission" class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Assignments / Submission</span>
      <h1 class="page-title">Попытка #{{ submission.attemptNumber }} для «{{ assignment.title }}»</h1>
      <p class="page-lead">
        {{
          workspace.canManageGroup.value
            ? 'Здесь manager-role проводит review по конкретной попытке, не смешивая его с редактурой задания.'
            : 'Здесь пользователь продолжает свой draft или читает уже отправленную и проверенную попытку.'
        }}
      </p>

      <div class="page-actions">
        <AppButton
          variant="secondary"
          :to="{
            name: 'group-assignment-details',
            params: {
              groupId,
              assignmentId,
            },
          }"
        >
          К заданию
        </AppButton>
        <AppButton
          v-if="workspace.canManageGroup.value"
          variant="secondary"
          :to="{
            name: 'group-assignment-submissions',
            params: {
              groupId,
              assignmentId,
            },
          }"
        >
          Ко всем submissions
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Попытка остаётся доступной для чтения, но draft updates и review changes отключены.
    </div>

    <SubmissionDraftForm
      v-if="isDraftEditable"
      :submission="submission"
      :is-busy="isBusy"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-assignment-details',
        params: {
          groupId,
          assignmentId,
        },
      }"
      @submit="handleDraftSubmit"
    />

    <div v-else class="section-grid">
      <AppCard class="span-8 submission-detail__card">
        <div class="submission-detail__header">
          <div>
            <h2 class="submission-detail__title">Содержимое попытки</h2>
            <p class="muted">Текст и вложения попытки остаются неизменяемыми после отправки или review.</p>
          </div>

          <SubmissionStatusBadge :status="submission.status" />
        </div>

        <p class="submission-detail__content">
          {{ getSubmissionSummary(submission.text, 'Текст попытки не заполнен. Возможно, работа состоит только из вложений.') }}
        </p>

        <div class="submission-detail__files">
          <h3 class="submission-detail__subheading">Файлы попытки</h3>

          <AppEmptyState
            v-if="submission.files.length === 0"
            title="Файлы не приложены"
            description="Эта попытка хранит только текстовую часть или была отправлена без вложений."
          />

          <ul v-else class="submission-detail__file-list">
            <li v-for="file in submission.files" :key="file.id" class="submission-detail__file-item">
              <div class="submission-detail__file-copy">
                <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
                <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </AppCard>

      <AppCard tone="accent" class="span-4 submission-detail__card">
        <div class="submission-detail__header">
          <div>
            <h2 class="submission-detail__title">Метаданные и review</h2>
            <p class="muted">Правая колонка держит таймлайн попытки, feedback и score.</p>
          </div>
        </div>

        <dl class="submission-detail__facts">
          <div>
            <dt>Автор</dt>
            <dd>{{ submission.author.displayName }}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>{{ submission.status }}</dd>
          </div>
          <div>
            <dt>Создано</dt>
            <dd>{{ formatAssignmentDateTime(submission.createdAt) }}</dd>
          </div>
          <div v-if="submission.submittedAt">
            <dt>Отправлено</dt>
            <dd>{{ formatAssignmentDateTime(submission.submittedAt) }}</dd>
          </div>
          <div v-if="submission.reviewedAt">
            <dt>Проверено</dt>
            <dd>{{ formatAssignmentDateTime(submission.reviewedAt) }}</dd>
          </div>
          <div>
            <dt>Оценка</dt>
            <dd>{{ formatSubmissionScore(submission.score, assignment.maxScore) }}</dd>
          </div>
        </dl>

        <div v-if="canReviewSubmission" class="submission-detail__review">
          <h3 class="submission-detail__subheading">Review flow</h3>

          <AppInput
            v-if="assignment.maxScore !== null"
            v-model="reviewScore"
            label="Score"
            type="number"
            min="0"
            :max="assignment.maxScore"
            step="1"
            :hint="`Максимум ${assignment.maxScore}. Поле можно обновить, но текущий контракт не умеет очищать уже выставленный score.`"
            :error="reviewScoreError"
            :disabled="isBusy"
          />

          <AppTextarea
            v-model="reviewFeedback"
            label="Feedback"
            placeholder="Что получилось хорошо, что стоит исправить и что ожидать от следующей попытки."
            hint="Feedback можно оставить и без score, если у задания нет max score."
            :disabled="isBusy"
          />

          <div class="submission-detail__review-actions">
            <AppButton :disabled="isBusy" @click="handleReviewSubmit()">
              {{ submission.status === 'REVIEWED' ? 'Обновить review' : 'Сохранить review' }}
            </AppButton>
          </div>

          <p v-if="reviewError" class="submission-detail__error">{{ reviewError }}</p>
        </div>

        <div v-else-if="workspace.canManageGroup.value && submission.status === 'DRAFT'" class="panel-note">
          Черновик пока не отправлен. Review flow открывается только после статуса `SUBMITTED`.
        </div>

        <div v-else-if="normalizeOptionalText(submission.feedback)" class="submission-detail__feedback">
          <h3 class="submission-detail__subheading">Feedback</h3>
          <p class="submission-detail__content">{{ submission.feedback }}</p>
        </div>

        <div v-else-if="submission.status === 'SUBMITTED'" class="panel-note">
          Работа отправлена и ожидает проверки. После review здесь появятся feedback и итоговый score.
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.submission-detail__card {
  gap: 1.2rem;
}

.submission-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.submission-detail__title,
.submission-detail__subheading {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.submission-detail__content {
  color: var(--color-text);
  line-height: 1.7;
  white-space: pre-wrap;
}

.submission-detail__files,
.submission-detail__review,
.submission-detail__feedback {
  display: grid;
  gap: 0.8rem;
}

.submission-detail__facts {
  display: grid;
  gap: 0.85rem;
}

.submission-detail__facts div {
  display: grid;
  gap: 0.25rem;
}

.submission-detail__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.submission-detail__facts dd {
  margin: 0;
  font-weight: 700;
}

.submission-detail__file-list {
  display: grid;
  gap: 0.75rem;
}

.submission-detail__file-item {
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.78);
}

.submission-detail__file-copy {
  display: grid;
  gap: 0.2rem;
}

.submission-detail__review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.submission-detail__error {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-sm);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .submission-detail__header {
    flex-direction: column;
  }
}
</style>
