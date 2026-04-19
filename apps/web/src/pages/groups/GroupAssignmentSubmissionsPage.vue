<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import {
  getAssignmentsErrorMessage,
} from '../../features/assignments/api/assignments.api'
import AssignmentSubmissionGroups from '../../features/assignments/components/AssignmentSubmissionGroups.vue'
import { useAssignment, useAssignmentSubmissions } from '../../features/assignments/composables/useAssignments'
import { groupSubmissionsByAuthor } from '../../features/assignments/lib/assignments.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))
const workspace = useGroupWorkspace(groupId)

const assignmentQuery = useAssignment(groupId, assignmentId, {
  enabled: workspace.isMember,
})
const submissionsQuery = useAssignmentSubmissions(groupId, assignmentId, {}, {
  enabled: computed(() => workspace.isMember.value && workspace.canManageGroup.value),
})

const assignment = computed(() => assignmentQuery.data.value ?? null)
const isAssignmentsModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.assignmentsEnabled,
)
const isBlocked = computed(() => !workspace.canManageGroup.value || isAssignmentsModuleUnavailable.value)
const assignmentErrorMessage = computed(() => {
  const error = assignmentQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить задание') : ''
})
const submissionsErrorMessage = computed(() => {
  const error = submissionsQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить review queue') : ''
})
const submissionGroups = computed(() => groupSubmissionsByAuthor(submissionsQuery.data.value ?? []))
const reviewedCount = computed(
  () => (submissionsQuery.data.value ?? []).filter((submission) => submission.status === 'REVIEWED').length,
)
const draftCount = computed(
  () => (submissionsQuery.data.value ?? []).filter((submission) => submission.status === 'DRAFT').length,
)
const submittedCount = computed(
  () => (submissionsQuery.data.value ?? []).filter((submission) => submission.status === 'SUBMITTED').length,
)

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isBlocked.value) {
    void router.replace({
      name: 'group-assignment-details',
      params: {
        groupId: groupId.value,
        assignmentId: assignmentId.value,
      },
    })
  }
})
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || (assignmentQuery.isPending.value && !assignment) || isBlocked"
    label="Собираем review queue для задания"
  />

  <AppErrorState
    v-else-if="assignmentErrorMessage"
    title="Не удалось открыть review queue"
    :description="assignmentErrorMessage"
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

  <div v-else-if="assignment" class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Assignments / Submissions</span>
      <h1 class="page-title">Review queue для «{{ assignment.title }}»</h1>
      <p class="page-lead">
        Отдельный submissions route концентрируется на grouped attempts по участникам и держит акцент на последней
        попытке, чтобы review не терялся в общем assignment detail.
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
          Назад к заданию
        </AppButton>
        <AppButton
          v-if="!workspace.isReadOnly.value"
          :to="{
            name: 'group-assignment-edit',
            params: {
              groupId,
              assignmentId,
            },
          }"
        >
          Редактировать задание
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Review queue остаётся видимым, но изменения feedback и score отключены.
    </div>

    <div class="section-grid">
      <AppCard tone="accent" class="span-4 submissions-summary">
        <div>
          <h2 class="submissions-summary__title">Сводка review flow</h2>
          <p class="muted">Основной ориентир — последняя попытка участника, но предыдущая история всегда остаётся рядом.</p>
        </div>

        <div class="metric-grid submissions-summary__grid">
          <div class="metric">
            <span class="metric__value">{{ submissionGroups.length }}</span>
            <span class="metric__label">Участники</span>
          </div>
          <div class="metric">
            <span class="metric__value">{{ submittedCount }}</span>
            <span class="metric__label">На review</span>
          </div>
          <div class="metric">
            <span class="metric__value">{{ reviewedCount }}</span>
            <span class="metric__label">Проверено</span>
          </div>
        </div>

        <p class="muted">Черновиков сейчас: {{ draftCount }}. Они видны менеджеру, но не должны уходить в review до отправки.</p>
      </AppCard>

      <AppCard class="span-8 submissions-queue">
        <div class="submissions-queue__header">
          <div>
            <h2 class="submissions-queue__title">Grouped submissions</h2>
            <p class="muted">Каждый блок показывает latest attempt сверху и предыдущие попытки ниже.</p>
          </div>
        </div>

        <AppLoader v-if="submissionsQuery.isPending.value" label="Загружаем queue попыток" />

        <AppErrorState
          v-else-if="submissionsErrorMessage"
          title="Не удалось загрузить попытки"
          :description="submissionsErrorMessage"
        />

        <AppEmptyState
          v-else-if="submissionGroups.length === 0"
          title="Пока нет попыток"
          description="Когда участники создадут draft или отправят работу, grouped queue появится здесь."
        />

        <AssignmentSubmissionGroups
          v-else
          :group-id="groupId"
          :assignment-id="assignmentId"
          :groups="submissionGroups"
        />
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.submissions-summary,
.submissions-queue {
  gap: 1.2rem;
}

.submissions-summary__title,
.submissions-queue__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.submissions-summary__grid {
  grid-template-columns: 1fr;
}
</style>
