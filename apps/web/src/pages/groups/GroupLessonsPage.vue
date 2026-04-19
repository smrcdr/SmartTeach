<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import {
  getLessonsErrorMessage,
  type Lesson,
  type LessonStatus,
} from '../../features/lessons/api/lessons.api'
import { useLessonsList, useReorderLessonsMutation } from '../../features/lessons/composables/useLessons'
import {
  formatLessonSchedule,
  getLessonSummary,
  isLessonVisibleToUser,
  lessonStatusLabels,
} from '../../features/lessons/lib/lessons.ui'
import LessonStatusBadge from '../../features/lessons/components/LessonStatusBadge.vue'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

type ManagerStatusFilter = 'ALL' | LessonStatus

const route = useRoute()

const statusFilter = ref<ManagerStatusFilter>('ALL')
const actionError = ref('')
const busyActionKey = ref('')

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const reorderLessonsMutation = useReorderLessonsMutation(groupId)

const canManageLessons = computed(() => workspace.canManageGroup.value)
const canCreateLesson = computed(() => canManageLessons.value && !workspace.isReadOnly.value)
const lessonsQuery = useLessonsList(
  groupId,
  computed(() => {
    if (!canManageLessons.value) {
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

const lessons = computed(() =>
  (lessonsQuery.data.value ?? []).filter((lesson) => isLessonVisibleToUser(lesson, canManageLessons.value)),
)
const canReorderLessons = computed(
  () => canCreateLesson.value && statusFilter.value === 'ALL' && lessons.value.length > 1,
)
const lessonsErrorMessage = computed(() => {
  const error = lessonsQuery.error.value

  return error ? getLessonsErrorMessage(error, 'Не удалось загрузить уроки группы') : ''
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

async function moveLesson(lesson: Lesson, direction: 'up' | 'down') {
  if (!canReorderLessons.value) {
    return
  }

  const currentIndex = lessons.value.findIndex((item) => item.id === lesson.id)
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= lessons.value.length) {
    return
  }

  const nextOrder = [...lessons.value]
  const [movedLesson] = nextOrder.splice(currentIndex, 1)

  nextOrder.splice(targetIndex, 0, movedLesson)

  busyActionKey.value = `reorder:${lesson.id}`
  actionError.value = ''

  try {
    await reorderLessonsMutation.mutateAsync(nextOrder)
  } catch (error) {
    actionError.value = getLessonsErrorMessage(error, 'Не удалось изменить порядок уроков')
  } finally {
    busyActionKey.value = ''
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Уроки</span>
      <h1 class="page-title">Уроки управляются как рабочий модуль со статусами, ручным порядком и отдельными страницами.</h1>
      <p class="page-lead">
        Список остаётся операционным: дата показывает контекст урока, но не диктует порядок. Для участников видны
        только опубликованные записи, а владельцы и администраторы отдельно управляют черновиками и архивом.
      </p>

      <div v-if="canCreateLesson" class="page-actions">
        <AppButton
          :to="{
            name: 'group-lesson-create',
            params: {
              groupId,
            },
          }"
        >
          Создать урок
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Список уроков и их содержимое остаются видимыми, но создание, редактирование и
      переупорядочивание отключены до восстановления группы.
    </div>

    <AppCard v-if="canManageLessons" class="lessons-toolbar">
      <div class="lessons-toolbar__copy">
        <h2 class="lessons-toolbar__title">Фильтр статусов</h2>
        <p class="muted">Ручное изменение порядка доступно только в режиме `Все статусы`, чтобы не путать общий порядок списка.</p>
      </div>

      <div class="lessons-toolbar__filters">
        <button
          v-for="filter in managerFilters"
          :key="filter.value"
          type="button"
          :class="['lessons-filter', { 'lessons-filter--active': statusFilter === filter.value }]"
          @click="statusFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </AppCard>

    <AppCard v-else tone="accent" class="lessons-toolbar">
      <div class="lessons-toolbar__copy">
        <h2 class="lessons-toolbar__title">Режим участника</h2>
        <p class="muted">
          Для роли `USER` список автоматически ограничен опубликованными уроками. Черновики и архив скрыты на уровне
          frontend-потока.
        </p>
      </div>
    </AppCard>

    <div v-if="actionError" class="panel-note panel-note--danger">
      {{ actionError }}
    </div>

    <AppLoader v-if="lessonsQuery.isPending.value" label="Загружаем раздел уроков и текущий порядок" />

    <AppErrorState
      v-else-if="lessonsErrorMessage"
      title="Не удалось загрузить уроки"
      :description="lessonsErrorMessage"
    >
      <template #actions>
        <AppButton variant="secondary" @click="lessonsQuery.refetch()">Повторить</AppButton>
      </template>
    </AppErrorState>

    <AppEmptyState
      v-else-if="lessons.length === 0"
      :title="canCreateLesson ? 'Уроков пока нет' : 'Пока нет опубликованных уроков'"
      :description="
        canCreateLesson
          ? 'Список готов к работе: можно создать первый урок без даты, с одним startsAt или сразу с полным временным слотом.'
          : 'Когда владелец или администратор опубликует урок, он появится здесь в общем порядке группы.'
      "
    >
      <template v-if="canCreateLesson" #actions>
        <AppButton
          :to="{
            name: 'group-lesson-create',
            params: {
              groupId,
            },
          }"
        >
          Создать первый урок
        </AppButton>
      </template>
    </AppEmptyState>

    <div v-else class="lessons-list">
      <AppCard v-for="(lesson, index) in lessons" :key="lesson.id" class="lesson-card">
        <div class="lesson-card__header">
          <div class="lesson-card__copy">
            <div class="lesson-card__meta">
              <LessonStatusBadge :status="lesson.status" />
              <span class="lesson-card__sort-order">Порядок #{{ lesson.sortOrder }}</span>
            </div>

            <h2 class="lesson-card__title">{{ lesson.title }}</h2>
            <p class="lesson-card__summary">{{ getLessonSummary(lesson.content) }}</p>
          </div>

          <div class="lesson-card__actions">
            <AppButton
              variant="secondary"
              size="sm"
              :to="{
                name: 'group-lesson-details',
                params: {
                  groupId,
                  lessonId: lesson.id,
                },
              }"
            >
              Открыть
            </AppButton>
            <AppButton
              v-if="canCreateLesson"
              variant="ghost"
              size="sm"
              :to="{
                name: 'group-lesson-edit',
                params: {
                  groupId,
                  lessonId: lesson.id,
                },
              }"
            >
              Редактировать
            </AppButton>
          </div>
        </div>

        <dl class="lesson-card__facts">
          <div>
            <dt>Дата</dt>
            <dd>{{ formatLessonSchedule(lesson.startsAt, lesson.endsAt) }}</dd>
          </div>
          <div>
            <dt>Файлы</dt>
            <dd>{{ lesson.files.length }}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>{{ lessonStatusLabels[lesson.status] }}</dd>
          </div>
        </dl>

        <div v-if="canReorderLessons" class="lesson-card__reorder">
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="index === 0 || reorderLessonsMutation.isPending.value"
            @click="moveLesson(lesson, 'up')"
          >
            Выше
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            :disabled="index === lessons.length - 1 || reorderLessonsMutation.isPending.value"
            @click="moveLesson(lesson, 'down')"
          >
            Ниже
          </AppButton>
          <span class="muted">
            {{
              busyActionKey === `reorder:${lesson.id}`
                ? 'Сохраняем новый порядок...'
                : 'Порядок влияет на основной список, а не на дату урока.'
            }}
          </span>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.lessons-toolbar {
  gap: 1rem;
}

.lessons-toolbar__copy {
  display: grid;
  gap: 0.4rem;
}

.lessons-toolbar__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.lessons-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.lessons-filter {
  min-height: 2.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.64);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.lessons-filter--active {
  border-color: rgba(31, 117, 156, 0.28);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.panel-note--danger {
  border-color: rgba(156, 71, 71, 0.18);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.lessons-list {
  display: grid;
  gap: 1rem;
}

.lesson-card {
  gap: 1.15rem;
}

.lesson-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lesson-card__copy {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.lesson-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.lesson-card__sort-order {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.68rem;
  border-radius: var(--radius-pill);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
  font-size: 0.82rem;
  font-weight: 800;
}

.lesson-card__title {
  font-size: 1.28rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.lesson-card__summary {
  color: var(--color-subtle);
}

.lesson-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.lesson-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.lesson-card__facts div {
  display: grid;
  gap: 0.28rem;
}

.lesson-card__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.lesson-card__facts dd {
  margin: 0;
  font-weight: 700;
}

.lesson-card__reorder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

@media (max-width: 720px) {
  .lesson-card__header {
    flex-direction: column;
  }

  .lesson-card__facts {
    grid-template-columns: 1fr;
  }
}
</style>
