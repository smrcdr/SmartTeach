<script setup lang="ts">
import { CheckCircle } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSubmission, updateSubmission } from '@/features/groups/api/groups.api'
import type { Submission } from '@/features/groups/api/groups.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextField from '@/shared/ui/AppTextField.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const route = useRoute()
const auth = useAuthStore()
const notifications = useNotificationStore()
const { group } = useGroup()
const submission = ref<Submission | null>(null)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))
const submissionId = computed(() => String(route.params.submissionId ?? ''))
const canManage = computed(() => canManageGroup(group.value))
const form = reactive({
  score: '',
  feedback: ''
})

async function refresh() {
  if (!groupId.value || !assignmentId.value || !submissionId.value || !auth.accessToken) {
    return
  }

  try {
    submission.value = await getSubmission(groupId.value, assignmentId.value, submissionId.value, auth.accessToken)
    form.score = submission.value.score === null ? '' : String(submission.value.score)
    form.feedback = submission.value.feedback ?? ''
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить решение'
  }
}

watch([groupId, assignmentId, submissionId, () => auth.accessToken], () => void refresh(), { immediate: true })

function validateForm() {
  if (form.score && Number(form.score) < 0) {
    notifications.error('Оценка не может быть отрицательной')
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
      ...(form.score ? { score: Number(form.score) } : {}),
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
      <h2>Ответ студента</h2>
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
      <h2>Проверка</h2>
      <AppTextField v-model="form.score" name="score" label="Оценка" type="number" placeholder="Например: 95" />
      <AppTextarea v-model="form.feedback" name="feedback" label="Комментарий" placeholder="Комментарий преподавателя" />
      <div class="review-form__actions">
        <AppButton type="submit" :disabled="isSubmitting">
          <CheckCircle :size="18" />
          {{ isSubmitting ? 'Сохраняем...' : 'Сохранить проверку' }}
        </AppButton>
      </div>
    </form>
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
.review-form h2 {
  color: var(--color-primary);
  font-size: 1.25rem;
  margin: 0;
}

.submission-panel p {
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
</style>
