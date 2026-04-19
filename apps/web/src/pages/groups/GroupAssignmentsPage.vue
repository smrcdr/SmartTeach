<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import {
  getAssignmentsErrorMessage,
  type Assignment,
  type AssignmentStatus,
} from '../../features/assignments/api/assignments.api'
import { useAssignmentsList } from '../../features/assignments/composables/useAssignments'
import {
  assignmentStatusLabels,
  formatAssignmentDueAt,
  getAssignmentSummary,
  isAssignmentVisibleToUser,
  sortAssignmentsByDueAt,
} from '../../features/assignments/lib/assignments.ui'
import AssignmentStatusBadge from '../../features/assignments/components/AssignmentStatusBadge.vue'
import { useLessonsList } from '../../features/lessons/composables/useLessons'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

type ManagerStatusFilter = 'ALL' | AssignmentStatus

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const statusFilter = ref<ManagerStatusFilter>('ALL')

const canManageAssignments = computed(() => workspace.canManageGroup.value)
const canCreateAssignment = computed(() => canManageAssignments.value && !workspace.isReadOnly.value)
const isAssignmentsModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.assignmentsEnabled,
)
const hasLessonsModule = computed(() => Boolean(workspace.settings.value?.lessonsEnabled))

const assignmentsQuery = useAssignmentsList(
  groupId,
  computed(() => {
    if (!canManageAssignments.value) {
      return {
        status: 'PUBLISHED' as const,
      }
    }

    return statusFilter.value === 'ALL'
      ? {}
      : {
          status: statusFilter.value,
        }
  }),
  {
    enabled: workspace.isMember,
  },
)
const lessonsQuery = useLessonsList(
  groupId,
  computed(() => (canManageAssignments.value ? {} : { status: 'PUBLISHED' as const })),
  {
    enabled: computed(() => workspace.isMember.value && hasLessonsModule.value),
  },
)

const assignments = computed(() =>
  sortAssignmentsByDueAt(
    (assignmentsQuery.data.value ?? []).filter((assignment) =>
      isAssignmentVisibleToUser(assignment, canManageAssignments.value),
    ),
  ),
)
const lessonsById = computed(() => new Map((lessonsQuery.data.value ?? []).map((lesson) => [lesson.id, lesson])))
const assignmentsErrorMessage = computed(() => {
  const error = assignmentsQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить assignments module') : ''
})

const managerFilters: Array<{
  label: string
  value: ManagerStatusFilter
}> = [
  {
    label: 'Все статусы',
    value: 'ALL',
  },
  {
    label: 'Черновики',
    value: 'DRAFT',
  },
  {
    label: 'Опубликованные',
    value: 'PUBLISHED',
  },
  {
    label: 'Архив',
    value: 'ARCHIVED',
  },
]

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

function getLessonMetaLabel(assignment: Assignment) {
  if (!assignment.lessonId) {
    return 'Без привязки к уроку'
  }

  if (!hasLessonsModule.value) {
    return 'Связанный урок скрыт: модуль lessons выключен'
  }

  return lessonsById.value.get(assignment.lessonId)?.title ?? 'Связанный урок'
}

function getLessonRoute(assignment: Assignment) {
  if (!assignment.lessonId || !hasLessonsModule.value || !lessonsById.value.has(assignment.lessonId)) {
    return null
  }

  return {
    name: 'group-lesson-details',
    params: {
      groupId: groupId.value,
      lessonId: assignment.lessonId,
    },
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || isAssignmentsModuleUnavailable"
    label="Собираем assignments module и проверяем доступность раздела"
  />

  <AppErrorState
    v-else-if="assignmentsErrorMessage"
    title="Не удалось загрузить задания"
    :description="assignmentsErrorMessage"
  >
    <template #actions>
      <AppButton variant="secondary" @click="assignmentsQuery.refetch()">Повторить</AppButton>
    </template>
  </AppErrorState>

  <div v-else class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Assignments</span>
      <h1 class="page-title">Задания собирают учебный цикл: дедлайны, статусы, вложения и вход в submission flow.</h1>
      <p class="page-lead">
        Основной список сортируется по дедлайну: записи со сроком идут первыми, standalone assignment без due date
        остаются ниже. Для участников показываются только опубликованные задания.
      </p>

      <div v-if="canCreateAssignment" class="page-actions">
        <AppButton
          :to="{
            name: 'group-assignment-create',
            params: {
              groupId,
            },
          }"
        >
          Создать задание
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Assignment detail и история попыток остаются доступными для чтения, но создание,
      редактирование и новые submissions отключены до восстановления группы.
    </div>

    <AppCard v-if="canManageAssignments" class="assignments-toolbar">
      <div class="assignments-toolbar__copy">
        <h2 class="assignments-toolbar__title">Фильтр статусов</h2>
        <p class="muted">
          Manager-ролям доступны черновики, публикация и архив. Для `USER` поток жёстко ограничен опубликованными
          заданиями.
        </p>
      </div>

      <div class="assignments-toolbar__filters">
        <button
          v-for="filter in managerFilters"
          :key="filter.value"
          type="button"
          :class="['assignments-filter', { 'assignments-filter--active': statusFilter === filter.value }]"
          @click="statusFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </AppCard>

    <AppCard v-else tone="accent" class="assignments-toolbar">
      <div class="assignments-toolbar__copy">
        <h2 class="assignments-toolbar__title">Режим участника</h2>
        <p class="muted">
          Здесь остаются только опубликованные задания и личный submission flow. Review queue и менеджерские статусы
          перенесены в отдельный admin-поток.
        </p>
      </div>
    </AppCard>

    <AppLoader v-if="assignmentsQuery.isPending.value" label="Загружаем assignments list и метаданные дедлайнов" />

    <AppEmptyState
      v-else-if="assignments.length === 0"
      :title="canCreateAssignment ? 'Заданий пока нет' : 'Пока нет опубликованных заданий'"
      :description="
        canCreateAssignment
          ? 'Можно создать первое задание без привязки к уроку, без due date или без max score.'
          : 'Когда владелец или администратор опубликует задание, оно появится здесь с входом в вашу историю попыток.'
      "
    >
      <template v-if="canCreateAssignment" #actions>
        <AppButton
          :to="{
            name: 'group-assignment-create',
            params: {
              groupId,
            },
          }"
        >
          Создать первое задание
        </AppButton>
      </template>
    </AppEmptyState>

    <div v-else class="assignments-list">
      <AppCard v-for="assignment in assignments" :key="assignment.id" class="assignment-card">
        <div class="assignment-card__header">
          <div class="assignment-card__copy">
            <div class="assignment-card__meta">
              <AssignmentStatusBadge :status="assignment.status" />
              <span class="pill">{{ formatAssignmentDueAt(assignment.dueAt) }}</span>
            </div>

            <h2 class="assignment-card__title">{{ assignment.title }}</h2>
            <p class="assignment-card__summary">{{ getAssignmentSummary(assignment.content) }}</p>
          </div>

          <div class="assignment-card__actions">
            <AppButton
              variant="secondary"
              size="sm"
              :to="{
                name: 'group-assignment-details',
                params: {
                  groupId,
                  assignmentId: assignment.id,
                },
              }"
            >
              Открыть
            </AppButton>
            <AppButton
              v-if="canCreateAssignment"
              variant="ghost"
              size="sm"
              :to="{
                name: 'group-assignment-edit',
                params: {
                  groupId,
                  assignmentId: assignment.id,
                },
              }"
            >
              Редактировать
            </AppButton>
            <AppButton v-if="getLessonRoute(assignment)" variant="ghost" size="sm" :to="getLessonRoute(assignment)!">
              К уроку
            </AppButton>
          </div>
        </div>

        <dl class="assignment-card__facts">
          <div>
            <dt>Дедлайн</dt>
            <dd>{{ formatAssignmentDueAt(assignment.dueAt) }}</dd>
          </div>
          <div>
            <dt>Связь</dt>
            <dd>{{ getLessonMetaLabel(assignment) }}</dd>
          </div>
          <div>
            <dt>Макс. балл</dt>
            <dd>{{ assignment.maxScore === null ? 'Без оценки' : assignment.maxScore }}</dd>
          </div>
          <div>
            <dt>Файлы</dt>
            <dd>{{ assignment.files.length }}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>{{ assignmentStatusLabels[assignment.status] }}</dd>
          </div>
        </dl>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.assignments-toolbar {
  gap: 1rem;
}

.assignments-toolbar__copy {
  display: grid;
  gap: 0.4rem;
}

.assignments-toolbar__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.assignments-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.assignments-filter {
  min-height: 2.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-subtle);
  font-weight: 700;
}

.assignments-filter--active {
  border-color: rgba(31, 117, 156, 0.2);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.assignments-list {
  display: grid;
  gap: 1rem;
}

.assignment-card {
  gap: 1.2rem;
}

.assignment-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.assignment-card__copy {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.assignment-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.assignment-card__title {
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.assignment-card__summary {
  color: var(--color-subtle);
  line-height: 1.7;
}

.assignment-card__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}

.assignment-card__facts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
}

.assignment-card__facts div {
  display: grid;
  gap: 0.28rem;
}

.assignment-card__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.assignment-card__facts dd {
  margin: 0;
  font-weight: 700;
}

@media (max-width: 900px) {
  .assignment-card__header {
    flex-direction: column;
  }

  .assignment-card__actions {
    justify-content: flex-start;
  }

  .assignment-card__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
