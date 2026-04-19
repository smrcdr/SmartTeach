<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import AssignmentForm from '../../features/assignments/components/AssignmentForm.vue'
import {
  deleteUploadedFile,
  getAssignmentsErrorMessage,
  uploadAssignmentFiles,
} from '../../features/assignments/api/assignments.api'
import { useCreateAssignmentMutation } from '../../features/assignments/composables/useAssignments'
import {
  buildCreateAssignmentPayload,
  type AssignmentEditorSubmission,
} from '../../features/assignments/lib/assignment-form'
import { useLessonsList } from '../../features/lessons/composables/useLessons'
import { lessonStatusLabels } from '../../features/lessons/lib/lessons.ui'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const createAssignmentMutation = useCreateAssignmentMutation(groupId)

const isUploading = ref(false)
const submitError = ref('')

const hasLessonsModule = computed(() => Boolean(workspace.settings.value?.lessonsEnabled))
const isAssignmentsModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.assignmentsEnabled,
)
const isBlocked = computed(
  () => !workspace.canManageGroup.value || workspace.isReadOnly.value || isAssignmentsModuleUnavailable.value,
)
const isBusy = computed(() => createAssignmentMutation.isPending.value || isUploading.value)

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
    return 'Модуль уроков выключен, поэтому задание можно создать только как самостоятельное.'
  }

  if (lessonsQuery.isPending.value) {
    return 'Загружаем список уроков для необязательной привязки.'
  }

  if (lessonsQuery.error.value) {
    return 'Не удалось получить список уроков. Создание самостоятельного задания всё равно доступно.'
  }

  if ((lessonsQuery.data.value ?? []).length === 0) {
    return 'В группе пока нет уроков. Это не мешает создать самостоятельное задание.'
  }

  return 'Привязка к уроку остаётся опциональной и служит только дополнительным контекстом.'
})
const isLessonSelectDisabled = computed(
  () => !hasLessonsModule.value || lessonsQuery.isPending.value || Boolean(lessonsQuery.error.value),
)

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isBlocked.value) {
    void router.replace({
      name: 'group-assignments',
      params: {
        groupId: groupId.value,
      },
    })
  }
})

async function handleSubmit(submission: AssignmentEditorSubmission) {
  submitError.value = ''
  isUploading.value = true

  let uploadedFileIds: string[] = []

  try {
    const uploadedFiles = await uploadAssignmentFiles(submission.newFiles)

    uploadedFileIds = uploadedFiles.map((file) => file.id)

    const assignment = await createAssignmentMutation.mutateAsync(
      buildCreateAssignmentPayload(submission, uploadedFileIds),
    )

    await router.push({
      name: 'group-assignment-details',
      params: {
        groupId: groupId.value,
        assignmentId: assignment.id,
      },
    })
  } catch (error) {
    if (uploadedFileIds.length > 0) {
      await Promise.allSettled(uploadedFileIds.map((fileId) => deleteUploadedFile(fileId)))
    }

    submitError.value = getAssignmentsErrorMessage(error, 'Не удалось создать задание')
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || isBlocked"
    label="Проверяем права на создание задания и готовим форму"
  />

  <div v-else class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Задания / Создание</span>
      <h1 class="page-title">Новое задание создаётся на отдельной странице с явным выбором статуса.</h1>
      <p class="page-lead">
        Форма покрывает полный набор полей шага 12: название, описание, необязательную привязку к уроку, дедлайн,
        максимальный балл и файлы.
      </p>
    </header>

    <AssignmentForm
      mode="create"
      :lesson-options="lessonOptions"
      :lesson-hint="lessonHint"
      :is-lesson-select-disabled="isLessonSelectDisabled"
      :is-busy="isBusy"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-assignments',
        params: {
          groupId,
        },
      }"
      @submit="handleSubmit"
    />
  </div>
</template>
