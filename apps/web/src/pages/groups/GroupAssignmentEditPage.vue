<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import AssignmentForm from '../../features/assignments/components/AssignmentForm.vue'
import {
  deleteUploadedFile,
  getAssignmentsErrorMessage,
  uploadAssignmentFile,
} from '../../features/assignments/api/assignments.api'
import { useAssignment, useUpdateAssignmentMutation } from '../../features/assignments/composables/useAssignments'
import {
  buildUpdateAssignmentPayload,
  type AssignmentEditorSubmission,
} from '../../features/assignments/lib/assignment-form'
import { useLessonsList } from '../../features/lessons/composables/useLessons'
import { lessonStatusLabels } from '../../features/lessons/lib/lessons.ui'
import AppButton from '../../shared/ui/AppButton.vue'
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
const updateAssignmentMutation = useUpdateAssignmentMutation(groupId, assignmentId)

const isUploading = ref(false)
const submitError = ref('')

const assignment = computed(() => assignmentQuery.data.value ?? null)
const hasLessonsModule = computed(() => Boolean(workspace.settings.value?.lessonsEnabled))
const isAssignmentsModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.assignmentsEnabled,
)
const isBlocked = computed(
  () => !workspace.canManageGroup.value || workspace.isReadOnly.value || isAssignmentsModuleUnavailable.value,
)
const isBusy = computed(
  () => assignmentQuery.isPending.value || updateAssignmentMutation.isPending.value || isUploading.value,
)
const assignmentErrorMessage = computed(() => {
  const error = assignmentQuery.error.value

  return error ? getAssignmentsErrorMessage(error, 'Не удалось загрузить задание для редактирования') : ''
})

const lessonsQuery = useLessonsList(groupId, {}, {
  enabled: computed(() => workspace.isMember.value && hasLessonsModule.value),
})
const lessonOptions = computed(() => {
  const options = [
    {
      label: 'Без привязки к уроку',
      value: '',
    },
  ]

  if (!hasLessonsModule.value || lessonsQuery.error.value) {
    if (assignment.value?.lessonId) {
      options.push({
        label: 'Текущая привязка к уроку скрыта или недоступна',
        value: assignment.value.lessonId,
      })
    }

    return options
  }

  const lessons = [...(lessonsQuery.data.value ?? [])].sort((left, right) => left.sortOrder - right.sortOrder)

  return [
    ...options,
    ...lessons.map((lesson) => ({
      label: `#${lesson.sortOrder} · ${lesson.title} · ${lessonStatusLabels[lesson.status]}`,
      value: lesson.id,
    })),
  ]
})
const lessonHint = computed(() => {
  if (!hasLessonsModule.value) {
    return 'Модуль lessons выключен. Можно править задание, но новая привязка к уроку недоступна.'
  }

  if (lessonsQuery.isPending.value) {
    return 'Загружаем список уроков.'
  }

  if (lessonsQuery.error.value) {
    return 'Не удалось получить список уроков. Остальные поля задания остаются доступными.'
  }

  if ((lessonsQuery.data.value ?? []).length === 0) {
    return 'Уроков в группе пока нет, поэтому задание можно оставить standalone.'
  }

  return 'При необходимости можно перепривязать задание к другому уроку или убрать связь совсем.'
})
const isLessonSelectDisabled = computed(
  () => !hasLessonsModule.value || lessonsQuery.isPending.value || Boolean(lessonsQuery.error.value),
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

async function handleSubmit(submission: AssignmentEditorSubmission) {
  if (!assignment.value) {
    return
  }

  submitError.value = ''
  isUploading.value = true

  let uploadedFileIds: string[] = []

  try {
    const uploadedFiles = await Promise.all(submission.newFiles.map((file) => uploadAssignmentFile(file)))

    uploadedFileIds = uploadedFiles.map((file) => file.id)

    await updateAssignmentMutation.mutateAsync(
      buildUpdateAssignmentPayload(assignment.value, submission, uploadedFileIds),
    )

    await router.push({
      name: 'group-assignment-details',
      params: {
        groupId: groupId.value,
        assignmentId: assignmentId.value,
      },
    })
  } catch (error) {
    if (uploadedFileIds.length > 0) {
      await Promise.allSettled(uploadedFileIds.map((fileId) => deleteUploadedFile(fileId)))
    }

    submitError.value = getAssignmentsErrorMessage(error, 'Не удалось обновить задание')
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || (assignmentQuery.isPending.value && !assignment) || isBlocked"
    label="Готовим edit flow задания и проверяем права доступа"
  />

  <AppErrorState
    v-else-if="assignmentErrorMessage"
    title="Не удалось открыть форму редактирования"
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
      <span class="page-eyebrow">Workspace / Assignments / Edit</span>
      <h1 class="page-title">Редактирование задания вынесено из списка в отдельный full-page flow.</h1>
      <p class="page-lead">
        Здесь меняются контент, дедлайн, lesson relation, файлы и итоговый статус задания. Review queue и submissions
        остаются на detail-уровне.
      </p>
    </header>

    <AssignmentForm
      mode="edit"
      :assignment="assignment"
      :lesson-options="lessonOptions"
      :lesson-hint="lessonHint"
      :is-lesson-select-disabled="isLessonSelectDisabled"
      :is-busy="isBusy"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-assignment-details',
        params: {
          groupId,
          assignmentId,
        },
      }"
      @submit="handleSubmit"
    />
  </div>
</template>
