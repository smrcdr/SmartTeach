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
import { useCreateLessonMutation } from '../../features/lessons/composables/useLessons'
import { buildCreateLessonPayload, type LessonEditorSubmission } from '../../features/lessons/lib/lesson-form'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const createLessonMutation = useCreateLessonMutation(groupId)

const isUploading = ref(false)
const submitError = ref('')

const isBlocked = computed(() => !workspace.canManageGroup.value || workspace.isReadOnly.value)
const isBusy = computed(() => createLessonMutation.isPending.value || isUploading.value)

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isBlocked.value) {
    void router.replace({
      name: 'group-lessons',
      params: {
        groupId: groupId.value,
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

    const lesson = await createLessonMutation.mutateAsync(buildCreateLessonPayload(submission, uploadedFileIds))

    await router.push({
      name: 'group-lesson-details',
      params: {
        groupId: groupId.value,
        lessonId: lesson.id,
      },
    })
  } catch (error) {
    if (uploadedFileIds.length > 0) {
      await Promise.allSettled(uploadedFileIds.map((fileId) => deleteUploadedFile(fileId)))
    }

    submitError.value = getLessonsErrorMessage(error, 'Не удалось создать урок')
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || isBlocked"
    label="Проверяем права на создание урока и готовим форму"
  />

  <div v-else class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Уроки / Создание</span>
      <h1 class="page-title">Новый урок создаётся на отдельной странице с явным выбором статуса.</h1>
      <p class="page-lead">
        Форма поддерживает все поля шага 11: название, содержание, необязательные даты и вложения. После сохранения
        страница урока становится основной точкой входа в запись.
      </p>
    </header>

    <LessonForm
      mode="create"
      :is-busy="isBusy"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-lessons',
        params: {
          groupId,
        },
      }"
      @submit="handleSubmit"
    />
  </div>
</template>
