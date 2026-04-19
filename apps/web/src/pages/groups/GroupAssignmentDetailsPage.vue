<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../features/auth/stores/auth.store'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import {
  getAssignmentsErrorMessage,
  type Submission,
} from '../../features/assignments/api/assignments.api'
import AssignmentSubmissionGroups from '../../features/assignments/components/AssignmentSubmissionGroups.vue'
import AssignmentStatusBadge from '../../features/assignments/components/AssignmentStatusBadge.vue'
import SubmissionStatusBadge from '../../features/assignments/components/SubmissionStatusBadge.vue'
import {
  useAssignment,
  useAssignmentSubmissions,
  useCreateSubmissionMutation,
} from '../../features/assignments/composables/useAssignments'
import {
  canCreateNextSubmissionAttempt,
  formatAssignmentDateTime,
  formatAssignmentDueAt,
  formatFileSize,
  formatSubmissionScore,
  getAssignmentSummary,
  getCurrentDraftSubmission,
  getLatestSubmission,
  getSubmissionSummary,
  groupSubmissionsByAuthor,
  isAssignmentVisibleToUser,
} from '../../features/assignments/lib/assignments.ui'
import { useLessonsList } from '../../features/lessons/composables/useLessons'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))
const workspace = useGroupWorkspace(groupId)

const assignmentQuery = useAssignment(groupId, assignmentId, {
  enabled: workspace.isMember,
})
const createSubmissionMutation = useCreateSubmissionMutation(groupId, assignmentId)

const actionError = ref('')

const assignment = computed(() => assignmentQuery.data.value ?? null)
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
const hasLessonsModule = computed(() => Boolean(workspace.settings.value?.lessonsEnabled))

const lessonsQuery = useLessonsList(
  groupId,
  computed(() => (workspace.canManageGroup.value ? {} : { status: 'PUBLISHED' as const })),
  {
    enabled: computed(
      () => workspace.isMember.value && Boolean(assignment.value?.lessonId) && hasLessonsModule.value,
    ),
  },
)
const linkedLesson = computed(() => {
  const lessonId = assignment.value?.lessonId

  if (!lessonId) {
    return null
  }

  return (lessonsQuery.data.value ?? []).find((lesson) => lesson.id === lessonId) ?? null
})

const submissionsQuery = useAssignmentSubmissions(
  groupId,
  assignmentId,
  computed(() => (workspace.canManageGroup.value ? {} : { mineOnly: true })),
  {
    enabled: computed(
      () => workspace.isMember.value && Boolean(assignment.value) && !shouldHideAssignment.value,
    ),
  },
)

const assignmentErrorMessage = computed(() => {
  const error = assignmentQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить задание') : ''
})
const submissionsErrorMessage = computed(() => {
  const error = submissionsQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить submissions') : ''
})
const submissions = computed(() => submissionsQuery.data.value ?? [])
const submissionHistory = computed(() =>
  [...submissions.value].sort(
    (left, right) =>
      right.attemptNumber - left.attemptNumber ||
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  ),
)
const managerSubmissionGroups = computed(() => groupSubmissionsByAuthor(submissions.value))
const currentDraft = computed(() => getCurrentDraftSubmission(submissions.value))
const latestSubmission = computed(() => getLatestSubmission(submissions.value))
const currentUserId = computed(() => authStore.currentUser?.id ?? '')
const canStartNewAttempt = computed(
  () =>
    !workspace.canManageGroup.value &&
    !workspace.isReadOnly.value &&
    currentUserId.value.length > 0 &&
    canCreateNextSubmissionAttempt(submissions.value),
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

async function startNewAttempt() {
  actionError.value = ''

  try {
    const submission = await createSubmissionMutation.mutateAsync({})

    await router.push({
      name: 'group-assignment-submission-details',
      params: {
        groupId: groupId.value,
        assignmentId: assignmentId.value,
        submissionId: submission.id,
      },
    })
  } catch (error) {
    actionError.value = getAssignmentsErrorMessage(error, 'Не удалось создать новую попытку')
  }
}

function getLinkedLessonLabel() {
  if (!assignment.value?.lessonId) {
    return 'Без привязки к уроку'
  }

  if (!hasLessonsModule.value) {
    return 'Связанный урок скрыт: модуль lessons выключен'
  }

  return linkedLesson.value?.title ?? 'Связанный урок'
}

function getLinkedLessonRoute() {
  if (!assignment.value?.lessonId || !linkedLesson.value) {
    return null
  }

  return {
    name: 'group-lesson-details',
    params: {
      groupId: groupId.value,
      lessonId: assignment.value.lessonId,
    },
  }
}

function getSubmissionTimestamp(submission: Submission) {
  if (submission.reviewedAt) {
    return `Проверено ${formatAssignmentDateTime(submission.reviewedAt)}`
  }

  if (submission.submittedAt) {
    return `Отправлено ${formatAssignmentDateTime(submission.submittedAt)}`
  }

  return `Обновлено ${formatAssignmentDateTime(submission.updatedAt)}`
}
</script>

<template>
  <AppLoader
    v-if="assignmentQuery.isPending.value || shouldHideAssignment || isAssignmentsModuleUnavailable"
    label="Открываем задание и проверяем допустимый сценарий для текущей роли"
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

  <div v-else-if="assignment" class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Задания / Детали</span>
      <h1 class="page-title">{{ assignment.title }}</h1>
      <p class="page-lead">
        {{
          workspace.canManageGroup.value
            ? 'Управляющий сценарий разделяет условие задания и очередь проверки: слева содержание и метаданные, справа попытки по участникам.'
            : 'Пользовательский сценарий держит условие, текущую работу и историю попыток в одном месте, не смешивая их с потоком проверки.'
        }}
      </p>

      <div class="page-actions">
        <AppButton
          variant="secondary"
          :to="{
            name: 'group-assignments',
            params: {
              groupId,
            },
          }"
        >
          К списку заданий
        </AppButton>
        <AppButton v-if="workspace.canManageGroup.value" variant="secondary" :to="{
          name: 'group-assignment-submissions',
          params: {
            groupId,
            assignmentId,
          },
        }">
          Очередь проверки
        </AppButton>
        <AppButton
          v-if="workspace.canManageGroup.value && !workspace.isReadOnly.value"
          :to="{
            name: 'group-assignment-edit',
            params: {
              groupId,
              assignmentId,
            },
          }"
        >
          Редактировать
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Детали задания и история попыток остаются доступны, но создание новых записей и
      обновления проверки отключены.
    </div>

    <div v-if="actionError" class="panel-note panel-note--danger">
      {{ actionError }}
    </div>

    <div v-if="workspace.canManageGroup.value" class="section-grid">
      <AppCard class="span-5 assignment-detail__card">
        <div class="assignment-detail__header">
          <div>
            <h2 class="assignment-detail__title">Условие и метаданные</h2>
            <p class="muted">Здесь остаётся контекст задания, а очередь проверки вынесена в отдельную колонку.</p>
          </div>

          <AssignmentStatusBadge :status="assignment.status" />
        </div>

        <p class="assignment-detail__content">{{ getAssignmentSummary(assignment.content) }}</p>

        <dl class="assignment-detail__facts">
          <div>
            <dt>Дедлайн</dt>
            <dd>{{ formatAssignmentDueAt(assignment.dueAt) }}</dd>
          </div>
          <div>
            <dt>Связанный урок</dt>
            <dd>{{ getLinkedLessonLabel() }}</dd>
          </div>
          <div>
            <dt>Макс. балл</dt>
            <dd>{{ assignment.maxScore === null ? 'Без оценки' : assignment.maxScore }}</dd>
          </div>
          <div>
            <dt>Создано</dt>
            <dd>{{ formatAssignmentDateTime(assignment.createdAt) }}</dd>
          </div>
          <div>
            <dt>Обновлено</dt>
            <dd>{{ formatAssignmentDateTime(assignment.updatedAt) }}</dd>
          </div>
        </dl>

        <div class="assignment-detail__actions">
          <AppButton v-if="getLinkedLessonRoute()" variant="ghost" size="sm" :to="getLinkedLessonRoute()!">
            Открыть урок
          </AppButton>
        </div>

        <div class="assignment-detail__files">
          <h3 class="assignment-detail__subheading">Файлы задания</h3>

          <AppEmptyState
            v-if="assignment.files.length === 0"
            title="Файлы не приложены"
            description="Условие задания уже рабочее и без вложений. Их можно добавить через страницу редактирования."
          />

          <ul v-else class="assignment-detail__file-list">
            <li v-for="file in assignment.files" :key="file.id" class="assignment-detail__file-item">
              <div class="assignment-detail__file-copy">
                <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
                <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </AppCard>

      <AppCard class="span-7 assignment-detail__card">
        <div class="assignment-detail__header">
          <div>
            <h2 class="assignment-detail__title">Попытки по участникам</h2>
            <p class="muted">Правая колонка акцентирует последнюю попытку участника и сохраняет историю ниже.</p>
          </div>

          <span class="pill">Участников с попытками: {{ managerSubmissionGroups.length }}</span>
        </div>

        <AppLoader v-if="submissionsQuery.isPending.value" label="Загружаем попытки по участникам" />

        <AppErrorState
          v-else-if="submissionsErrorMessage"
          title="Не удалось загрузить попытки"
          :description="submissionsErrorMessage"
        />

        <AppEmptyState
          v-else-if="managerSubmissionGroups.length === 0"
          title="Попыток пока нет"
          description="Когда участники создадут хотя бы один черновик или отправят работу, очередь проверки появится здесь и на отдельной странице попыток."
        />

        <AssignmentSubmissionGroups
          v-else
          :group-id="groupId"
          :assignment-id="assignmentId"
          :groups="managerSubmissionGroups"
        />
      </AppCard>
    </div>

    <div v-else class="section-grid">
      <AppCard class="span-7 assignment-detail__card">
        <div class="assignment-detail__header">
          <div>
            <h2 class="assignment-detail__title">Условие задания</h2>
            <p class="muted">Основное описание и материалы задания остаются отдельно от истории попыток.</p>
          </div>

          <AssignmentStatusBadge :status="assignment.status" />
        </div>

        <p class="assignment-detail__content">{{ getAssignmentSummary(assignment.content) }}</p>

        <div class="assignment-detail__files">
          <h3 class="assignment-detail__subheading">Файлы задания</h3>

          <AppEmptyState
            v-if="assignment.files.length === 0"
            title="Файлы не приложены"
            description="Задание можно выполнять и без вложений. Если материалы появятся позже, они станут доступны здесь."
          />

          <ul v-else class="assignment-detail__file-list">
            <li v-for="file in assignment.files" :key="file.id" class="assignment-detail__file-item">
              <div class="assignment-detail__file-copy">
                <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
                <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </AppCard>

      <AppCard tone="accent" class="span-5 assignment-detail__card">
        <div class="assignment-detail__header">
          <div>
            <h2 class="assignment-detail__title">Моя текущая работа</h2>
            <p class="muted">Текущий черновик и следующая попытка управляются отдельно от общей истории.</p>
          </div>
        </div>

        <dl class="assignment-detail__facts">
          <div>
            <dt>Дедлайн</dt>
            <dd>{{ formatAssignmentDueAt(assignment.dueAt) }}</dd>
          </div>
          <div>
            <dt>Связанный урок</dt>
            <dd>{{ getLinkedLessonLabel() }}</dd>
          </div>
          <div>
            <dt>Макс. балл</dt>
            <dd>{{ assignment.maxScore === null ? 'Без оценки' : assignment.maxScore }}</dd>
          </div>
        </dl>

        <AppLoader v-if="submissionsQuery.isPending.value" label="Собираем текущую работу и историю попыток" />

        <AppErrorState
          v-else-if="submissionsErrorMessage"
          title="Не удалось загрузить мои попытки"
          :description="submissionsErrorMessage"
        />

        <AppEmptyState
          v-else-if="!latestSubmission"
          title="Попыток пока нет"
          description="Можно создать первый черновик и возвращаться к нему, пока работа не готова к отправке."
        >
          <template v-if="!workspace.isReadOnly.value" #actions>
            <AppButton :disabled="createSubmissionMutation.isPending.value" @click="startNewAttempt()">
              Начать черновик
            </AppButton>
          </template>
        </AppEmptyState>

        <template v-else>
          <div class="assignment-detail__current-work">
            <div class="assignment-detail__current-head">
              <div>
                <strong>
                  {{
                    currentDraft
                      ? `Черновик #${currentDraft.attemptNumber}`
                      : `Последняя попытка #${latestSubmission.attemptNumber}`
                  }}
                </strong>
                <p class="muted">
                  {{
                    currentDraft
                      ? 'Текущая работа остаётся редактируемой до отправки.'
                      : latestSubmission.status === 'SUBMITTED'
                        ? 'Работа отправлена и ждёт проверки.'
                        : 'Последняя попытка уже проверена. История сохранена и доступна ниже.'
                  }}
                </p>
              </div>

              <SubmissionStatusBadge :status="(currentDraft ?? latestSubmission).status" />
            </div>

            <p class="assignment-detail__current-summary">
              {{ getSubmissionSummary((currentDraft ?? latestSubmission).text, 'Текст текущей работы пока не добавлен.') }}
            </p>

            <div class="assignment-detail__current-actions">
              <AppButton
                variant="secondary"
                size="sm"
                :to="{
                  name: 'group-assignment-submission-details',
                  params: {
                    groupId,
                    assignmentId,
                    submissionId: (currentDraft ?? latestSubmission).id,
                  },
                }"
              >
                {{ currentDraft ? 'Открыть черновик' : 'Открыть попытку' }}
              </AppButton>
              <AppButton
                v-if="canStartNewAttempt"
                size="sm"
                :disabled="createSubmissionMutation.isPending.value"
                @click="startNewAttempt()"
              >
                Новая попытка
              </AppButton>
            </div>
          </div>
        </template>
      </AppCard>

      <AppCard class="span-12 assignment-detail__card">
        <div class="assignment-detail__header">
          <div>
            <h2 class="assignment-detail__title">История попыток</h2>
            <p class="muted">После новой попытки предыдущие записи не теряются и остаются доступными поштучно.</p>
          </div>
        </div>

        <AppLoader v-if="submissionsQuery.isPending.value" label="Готовим timeline моих попыток" />

        <AppErrorState
          v-else-if="submissionsErrorMessage"
          title="Не удалось загрузить историю"
          :description="submissionsErrorMessage"
        />

        <AppEmptyState
          v-else-if="submissionHistory.length === 0"
          title="История пока пустая"
          description="Как только вы создадите первый черновик, он сразу появится здесь."
        />

        <ul v-else class="assignment-detail__history">
          <li v-for="submission in submissionHistory" :key="submission.id" class="assignment-detail__history-item">
            <div class="assignment-detail__history-copy">
              <div class="assignment-detail__history-head">
                <strong>Попытка #{{ submission.attemptNumber }}</strong>
                <SubmissionStatusBadge :status="submission.status" />
              </div>
              <p class="muted">{{ getSubmissionTimestamp(submission) }}</p>
              <p class="assignment-detail__history-summary">
                {{ getSubmissionSummary(submission.text, 'Текст попытки пока не заполнен.') }}
              </p>
            </div>

            <div class="assignment-detail__history-side">
              <span class="pill">{{ formatSubmissionScore(submission.score, assignment.maxScore) }}</span>
              <AppButton
                variant="ghost"
                size="sm"
                :to="{
                  name: 'group-assignment-submission-details',
                  params: {
                    groupId,
                    assignmentId,
                    submissionId: submission.id,
                  },
                }"
              >
                Детали
              </AppButton>
            </div>
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.assignment-detail__card {
  gap: 1.2rem;
}

.assignment-detail__header,
.assignment-detail__current-head,
.assignment-detail__history-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.assignment-detail__title,
.assignment-detail__subheading {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.assignment-detail__content,
.assignment-detail__current-summary,
.assignment-detail__history-summary {
  color: var(--color-text);
  line-height: 1.7;
  white-space: pre-wrap;
}

.assignment-detail__facts {
  display: grid;
  gap: 0.85rem;
}

.assignment-detail__facts div {
  display: grid;
  gap: 0.25rem;
}

.assignment-detail__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.assignment-detail__facts dd {
  margin: 0;
  font-weight: 700;
}

.assignment-detail__actions,
.assignment-detail__current-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.assignment-detail__files {
  display: grid;
  gap: 0.8rem;
}

.assignment-detail__file-list,
.assignment-detail__history {
  display: grid;
  gap: 0.8rem;
}

.assignment-detail__file-item,
.assignment-detail__history-item,
.assignment-detail__current-work {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.76);
}

.assignment-detail__file-copy,
.assignment-detail__history-copy,
.assignment-detail__history-side,
.assignment-detail__current-work {
  display: grid;
  gap: 0.45rem;
}

.assignment-detail__history-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.panel-note--danger {
  border-color: rgba(156, 71, 71, 0.18);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .assignment-detail__header,
  .assignment-detail__current-head,
  .assignment-detail__history-item {
    flex-direction: column;
  }
}
</style>
