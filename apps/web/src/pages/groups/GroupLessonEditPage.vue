<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import LessonForm from '../../features/lessons/components/LessonForm.vue'
import {
  deleteUploadedFile,
  getLessonsErrorMessage,
  uploadLessonFile,
} from '../../features/lessons/api/lessons.api'
import { useLesson, useUpdateLessonMutation } from '../../features/lessons/composables/useLessons'
import { buildUpdateLessonPayload, type LessonEditorSubmission } from '../../features/lessons/lib/lesson-form'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'
import AppButton from '../../shared/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const lessonId = computed(() => String(route.params.lessonId ?? ''))
const workspace = useGroupWorkspace(groupId)
const lessonQuery = useLesson(groupId, lessonId, {
  enabled: workspace.isMember,
})
const updateLessonMutation = useUpdateLessonMutation(groupId, lessonId)

const isUploading = ref(false)
const submitError = ref('')

const lesson = computed(() => lessonQuery.data.value ?? null)
const lessonErrorMessage = computed(() => {
  const error = lessonQuery.error.value

  return error ? getLessonsErrorMessage(error, 'Не удалось загрузить урок для редактирования') : ''
})
const isBlocked = computed(() => !workspace.canManageGroup.value || workspace.isReadOnly.value)
const isBusy = computed(() => lessonQuery.isPending.value || updateLessonMutation.isPending.value || isUploading.value)

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isBlocked.value) {
    void router.replace({
      name: 'group-lesson-details',
      params: {
        groupId: groupId.value,
        lessonId: lessonId.value,
      },
    })
  }
})

async function handleSubmit(submission: LessonEditorSubmission) {
  submitError.value = ''
  isUploading.value = true

  let uploadedFileIds: string[] = []

  try {
    const uploadedFiles = await Promise.all(submission.newFiles.map((file) => uploadLessonFile(file)))

    uploadedFileIds = uploadedFiles.map((file) => file.id)

    await updateLessonMutation.mutateAsync(buildUpdateLessonPayload(submission, uploadedFileIds))

    await router.push({
      name: 'group-lesson-details',
      params: {
        groupId: groupId.value,
        lessonId: lessonId.value,
      },
    })
  } catch (error) {
    if (uploadedFileIds.length > 0) {
      await Promise.allSettled(uploadedFileIds.map((fileId) => deleteUploadedFile(fileId)))
    }

    submitError.value = getLessonsErrorMessage(error, 'Не удалось обновить урок')
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || (lessonQuery.isPending.value && !lesson) || isBlocked"
    label="Готовим страницу редактирования урока и проверяем доступ"
  />

  <AppErrorState
    v-else-if="lessonErrorMessage"
    title="Не удалось открыть форму редактирования"
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
      <span class="page-eyebrow">Рабочее пространство / Уроки / Редактирование</span>
      <h1 class="page-title">Редактирование урока вынесено из списка на отдельную страницу.</h1>
      <p class="page-lead">
        Здесь меняются контент, даты, вложения и итоговый статус записи. После сохранения пользователь возвращается в
        детали урока уже с новым состоянием записи.
      </p>
    </header>

    <LessonForm
      mode="edit"
      :lesson="lesson"
      :is-busy="isBusy"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-lesson-details',
        params: {
          groupId,
          lessonId,
        },
      }"
      @submit="handleSubmit"
    />
  </div>
</template>
