<script setup lang="ts">
import { CheckCircle } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAssignment, getSubmission, updateSubmission } from '@/features/groups/api/groups.api'
import type { Assignment, Submission } from '@/features/groups/api/groups.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const route = useRoute()
const auth = useAuthStore()
const notifications = useNotificationStore()
const { group } = useGroup()
const assignment = ref<Assignment | null>(null)
const submission = ref<Submission | null>(null)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))
const submissionId = computed(() => String(route.params.submissionId ?? ''))
const canManage = computed(() => canManageGroup(group.value))
const maxScore = computed(() => assignment.value?.maxScore ?? null)
const scoreValue = computed(() => form.score.trim() === '' ? null : Number(form.score))
const hasInvalidScore = computed(() => form.score.trim() !== '' && Number.isNaN(scoreValue.value))
const scoreExceedsMax = computed(() =>
  maxScore.value !== null &&
  scoreValue.value !== null &&
  !Number.isNaN(scoreValue.value) &&
  scoreValue.value > maxScore.value
)
const maxScoreLabel = computed(() => maxScore.value === null ? 'Максимум не задан' : `Максимум: ${maxScore.value}`)
const reviewedScoreLabel = computed(() => {
  if (!submission.value || submission.value.score === null) {
    return 'Оценка пока не выставлена'
  }

  return maxScore.value === null
    ? `${submission.value.score} баллов`
    : `${submission.value.score} из ${maxScore.value} баллов`
})
const form = reactive({
  score: '',
  feedback: ''
})

async function refresh() {
  if (!groupId.value || !assignmentId.value || !submissionId.value || !auth.accessToken) {
    return
  }

  try {
    const [nextSubmission, nextAssignment] = await Promise.all([
      getSubmission(groupId.value, assignmentId.value, submissionId.value, auth.accessToken),
      getAssignment(groupId.value, assignmentId.value, auth.accessToken)
    ])

    submission.value = nextSubmission
    assignment.value = nextAssignment
    form.score = submission.value.score === null ? '' : String(submission.value.score)
    form.feedback = submission.value.feedback ?? ''
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить решение'
  }
}

watch([groupId, assignmentId, submissionId, () => auth.accessToken], () => void refresh(), { immediate: true })

function validateForm() {
  if (hasInvalidScore.value) {
    notifications.error('Введите корректную оценку')
    return false
  }

  if (scoreValue.value !== null && scoreValue.value < 0) {
    notifications.error('Оценка не может быть отрицательной')
    return false
  }

  if (scoreExceedsMax.value) {
    notifications.error('Оценка больше баллов, чем можно выдать за задание')
    return false
  }

  return true
}

async function submitReview() {
  if (!groupId.value || !assignmentId.value || !submissionId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    submission.value = await updateSubmission(groupId.value, assignmentId.value, submissionId.value, {
      status: 'REVIEWED',
      ...(scoreValue.value !== null ? { score: scoreValue.value } : {}),
      feedback: form.feedback.trim()
    }, auth.accessToken)
    notifications.success('Проверка сохранена')
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось сохранить проверку')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main v-if="submission" class="page narrow-page">
    <AppPageHeader
      eyebrow="Решение"
      :title="submission.author.displayName"
      :description="submission.submittedAt ? `Отправлено ${formatDateTime(submission.submittedAt)}` : `Попытка ${submission.attemptNumber}`"
      align="split"
    >
      <template #actions>
        <StatusPill
          :label="submission.status"
          :tone="submission.status === 'REVIEWED' ? 'success' : submission.status === 'SUBMITTED' ? 'warning' : 'muted'"
        />
      </template>
    </AppPageHeader>

    <section class="surface-panel submission-panel">
      <h2>{{ canManage ? 'Ответ студента' : 'Ваш ответ' }}</h2>
      <p>{{ submission.text ?? 'Решение без текстового комментария.' }}</p>

      <div v-if="submission.files.length > 0" class="submission-panel__files">
        <a
          v-for="file in submission.files"
          :key="file.id"
          :href="file.url"
          target="_blank"
          rel="noreferrer"
        >
          {{ file.originalName }}
        </a>
      </div>
    </section>

    <form v-if="canManage" class="surface-panel review-form" @submit.prevent="submitReview">
      <header class="review-form__header">
        <h2>Проверка</h2>
        <span class="score-limit">{{ maxScoreLabel }}</span>
      </header>
      <label class="score-field" :class="{ 'score-field--warning': scoreExceedsMax }">
        <span>Оценка</span>
        <input v-model="form.score" name="score" type="number" min="0" :max="maxScore ?? undefined" placeholder="Например: 95">
      </label>
      <p v-if="scoreExceedsMax" class="score-warning">
        Это больше баллов, чем можно выдать за задание.
      </p>
      <AppTextarea v-model="form.feedback" name="feedback" label="Комментарий" placeholder="Комментарий преподавателя" />
      <div class="review-form__actions">
        <AppButton type="submit" :disabled="isSubmitting">
          <CheckCircle :size="18" />
          {{ isSubmitting ? 'Сохраняем...' : 'Сохранить проверку' }}
        </AppButton>
      </div>
    </form>

    <section v-else-if="submission.status === 'REVIEWED'" class="surface-panel review-result">
      <h2>Результат проверки</h2>
      <div class="review-result__score">{{ reviewedScoreLabel }}</div>
      <p v-if="submission.feedback">{{ submission.feedback }}</p>
      <p v-else>Комментарий преподавателя не добавлен.</p>
    </section>
  </main>
  <main v-else class="page narrow-page">
    <EmptyState title="Решение не загружено" :description="error ?? 'Данные решения ожидаются от API.'" />
  </main>
</template>

<style scoped>
.submission-panel,
.review-form {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 34px);
}

.submission-panel h2,
.review-form h2,
.review-result h2 {
  color: var(--color-primary);
  font-size: 1.25rem;
  margin: 0;
}

.submission-panel p,
.review-result p {
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0;
}

.submission-panel__files {
  border-top: 1px solid var(--color-divider);
  display: grid;
  gap: 10px;
  padding-top: 18px;
}

.submission-panel__files a {
  color: var(--color-primary);
  font-weight: 780;
}

.submission-panel__files a:hover {
  text-decoration: underline;
}

.review-form__actions {
  display: flex;
  justify-content: flex-start;
}

.review-form__header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}

.score-limit {
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  padding: 8px 10px;
}

.score-field {
  display: grid;
  gap: 8px;
}

.score-field span {
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.score-field input {
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

.score-field input:focus {
  background: var(--color-surface-highest);
  border-color: var(--color-focus-border);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.score-field--warning input {
  border-color: var(--color-error);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-error) 12%, transparent);
}

.score-warning {
  background: var(--color-danger-surface);
  border: 1px solid color-mix(in srgb, var(--color-error) 34%, transparent);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.92rem;
  font-weight: 720;
  margin: -6px 0 0;
  padding: 12px 14px;
}

.review-result {
  display: grid;
  gap: 16px;
  padding: clamp(24px, 4vw, 34px);
}

.review-result__score {
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-size: 1.3rem;
  font-weight: 900;
  padding: 16px;
}
</style>
