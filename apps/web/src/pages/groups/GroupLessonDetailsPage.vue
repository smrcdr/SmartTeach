<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import { getLessonsErrorMessage } from '../../features/lessons/api/lessons.api'
import { useLesson, useLessonLinkedAssignments } from '../../features/lessons/composables/useLessons'
import {
  assignmentStatusLabels,
  formatFileSize,
  formatLessonDateTime,
  formatLessonSchedule,
  formatOptionalDueAt,
  getLessonSummary,
  isLessonVisibleToUser,
  lessonStatusLabels,
  normalizeOptionalText,
} from '../../features/lessons/lib/lessons.ui'
import LessonStatusBadge from '../../features/lessons/components/LessonStatusBadge.vue'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const lessonId = computed(() => String(route.params.lessonId ?? ''))
const workspace = useGroupWorkspace(groupId)
const lessonQuery = useLesson(groupId, lessonId, {
  enabled: workspace.isMember,
})
const lesson = computed(() => lessonQuery.data.value ?? null)
const shouldHideLesson = computed(() => {
  const currentLesson = lesson.value

  if (!currentLesson) {
    return false
  }

  return !isLessonVisibleToUser(currentLesson, workspace.canManageGroup.value)
})
const linkedAssignmentsQuery = useLessonLinkedAssignments(
  groupId,
  lessonId,
  computed(() => (workspace.canManageGroup.value ? {} : { status: 'PUBLISHED' as const })),
  {
    enabled: computed(
      () =>
        workspace.isMember.value &&
        Boolean(lesson.value) &&
        !shouldHideLesson.value &&
        Boolean(workspace.settings.value?.assignmentsEnabled),
    ),
  },
)

const lessonErrorMessage = computed(() => {
  const error = lessonQuery.error.value

  return error ? getLessonsErrorMessage(error, 'Не удалось загрузить урок') : ''
})
const linkedAssignmentsErrorMessage = computed(() => {
  const error = linkedAssignmentsQuery.error.value

  return error ? getLessonsErrorMessage(error, 'Не удалось загрузить связанные задания') : ''
})
const linkedAssignments = computed(() => linkedAssignmentsQuery.data.value ?? [])
const canEditLesson = computed(() => workspace.canManageGroup.value && !workspace.isReadOnly.value)
const hasAssignmentsModule = computed(() => Boolean(workspace.settings.value?.assignmentsEnabled))

watchEffect(() => {
  if (!lessonQuery.isPending.value && shouldHideLesson.value) {
    void router.replace({
      name: 'group-lessons',
      params: {
        groupId: groupId.value,
      },
    })
  }
})
</script>

<template>
  <AppLoader
    v-if="lessonQuery.isPending.value || shouldHideLesson"
    label="Открываем урок и проверяем доступность lesson detail для текущей роли"
  />

  <AppErrorState
    v-else-if="lessonErrorMessage"
    title="Не удалось открыть урок"
    :description="lessonErrorMessage"
  >
    <template #actions>
      <AppButton
        variant="secondary"
        :to="{
          name: 'group-lessons',
          params: {
            groupId,
          },
        }"
      >
        Назад к урокам
      </AppButton>
    </template>
  </AppErrorState>

  <div v-else-if="lesson" class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Уроки / Детали</span>
      <h1 class="page-title">{{ lesson.title }}</h1>
      <p class="page-lead">
        Детальный экран собирает контент, вложения и связанные задания в одном месте. Управляющие действия отделены от
        списка и вынесены в отдельное редактирование.
      </p>

      <div class="page-actions">
        <AppButton
          variant="secondary"
          :to="{
            name: 'group-lessons',
            params: {
              groupId,
            },
          }"
        >
          К списку уроков
        </AppButton>
        <AppButton
          v-if="canEditLesson"
          :to="{
            name: 'group-lesson-edit',
            params: {
              groupId,
              lessonId,
            },
          }"
        >
          Редактировать
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Детали урока остаются доступными для чтения, но все действия редактирования
      отключены до восстановления рабочего пространства.
    </div>

    <div class="section-grid">
      <AppCard class="span-8 lesson-detail__card">
        <div class="lesson-detail__header">
          <div>
            <h2 class="lesson-detail__title">Содержание</h2>
            <p class="muted">Основной контент урока и его рабочий контекст для участников группы.</p>
          </div>

          <LessonStatusBadge :status="lesson.status" />
        </div>

        <p class="lesson-detail__content">{{ getLessonSummary(lesson.content) }}</p>
      </AppCard>

      <AppCard tone="accent" class="span-4 lesson-detail__card">
        <div class="lesson-detail__header">
          <div>
            <h2 class="lesson-detail__title">Метаданные</h2>
            <p class="muted">Дата остаётся вторичной: основной список всё равно держится на порядке записей.</p>
          </div>
        </div>

        <dl class="lesson-detail__facts">
          <div>
            <dt>Статус</dt>
            <dd>{{ lessonStatusLabels[lesson.status] }}</dd>
          </div>
          <div>
            <dt>Порядок</dt>
            <dd>#{{ lesson.sortOrder }}</dd>
          </div>
          <div>
            <dt>Слот</dt>
            <dd>{{ formatLessonSchedule(lesson.startsAt, lesson.endsAt) }}</dd>
          </div>
          <div>
            <dt>Создан</dt>
            <dd>{{ formatLessonDateTime(lesson.createdAt) }}</dd>
          </div>
          <div>
            <dt>Обновлён</dt>
            <dd>{{ formatLessonDateTime(lesson.updatedAt) }}</dd>
          </div>
          <div v-if="normalizeOptionalText(lesson.archivedAt)">
            <dt>Архивирован</dt>
            <dd>{{ formatLessonDateTime(normalizeOptionalText(lesson.archivedAt)) }}</dd>
          </div>
        </dl>
      </AppCard>

      <AppCard class="span-8 lesson-detail__card">
        <div class="lesson-detail__header">
          <div>
            <h2 class="lesson-detail__title">Файлы урока</h2>
            <p class="muted">Здесь остаются только фактически привязанные материалы.</p>
          </div>
        </div>

        <AppEmptyState
          v-if="lesson.files.length === 0"
          title="Материалы пока не добавлены"
          description="Урок уже можно использовать без вложений, а файлы прикрепить позже через отдельную форму редактирования."
        />

        <ul v-else class="lesson-detail__file-list">
          <li v-for="file in lesson.files" :key="file.id" class="lesson-detail__file-item">
            <div class="lesson-detail__file-copy">
              <a :href="file.url" target="_blank" rel="noreferrer">{{ file.originalName }}</a>
              <span class="muted">{{ formatFileSize(file.sizeBytes) }}</span>
            </div>
          </li>
        </ul>
      </AppCard>

      <AppCard class="span-4 lesson-detail__card">
        <div class="lesson-detail__header">
          <div>
            <h2 class="lesson-detail__title">Связанные задания</h2>
            <p class="muted">Здесь показываются только задания, привязанные к текущему уроку.</p>
          </div>
        </div>

        <AppEmptyState
          v-if="!hasAssignmentsModule"
          title="Модуль заданий выключен"
          description="Навигация группы уже скрыла раздел заданий, поэтому у урока сейчас нет активного контекста заданий."
        />

        <AppLoader v-else-if="linkedAssignmentsQuery.isPending.value" label="Загружаем задания, связанные с уроком" />

        <AppErrorState
          v-else-if="linkedAssignmentsErrorMessage"
          title="Не удалось загрузить задания"
          :description="linkedAssignmentsErrorMessage"
        />

        <AppEmptyState
          v-else-if="linkedAssignments.length === 0"
          title="Связанных заданий пока нет"
          description="Когда в модуле заданий появятся привязанные записи, этот блок станет операционной точкой входа в них."
        />

        <ul v-else class="lesson-detail__assignment-list">
          <li v-for="assignment in linkedAssignments" :key="assignment.id" class="lesson-detail__assignment-item">
            <div class="lesson-detail__assignment-copy">
              <strong>{{ assignment.title }}</strong>
              <span class="pill">{{ assignmentStatusLabels[assignment.status] }}</span>
              <span class="muted">{{ formatOptionalDueAt(assignment.dueAt) }}</span>
            </div>

            <AppButton
              variant="ghost"
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
          </li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.lesson-detail__card {
  gap: 1.2rem;
}

.lesson-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.lesson-detail__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.lesson-detail__content {
  color: var(--color-text);
  line-height: 1.7;
  white-space: pre-wrap;
}

.lesson-detail__facts {
  display: grid;
  gap: 0.9rem;
}

.lesson-detail__facts div {
  display: grid;
  gap: 0.28rem;
}

.lesson-detail__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.lesson-detail__facts dd {
  margin: 0;
  font-weight: 700;
}

.lesson-detail__file-list,
.lesson-detail__assignment-list {
  display: grid;
  gap: 0.75rem;
}

.lesson-detail__file-item,
.lesson-detail__assignment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.58);
}

.lesson-detail__assignment-copy,
.lesson-detail__file-copy {
  display: grid;
  gap: 0.35rem;
}

.lesson-detail__file-copy a {
  overflow-wrap: anywhere;
}
</style>
