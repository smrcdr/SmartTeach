<script setup lang="ts">
import { Paperclip, Send, X } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { createSubmission, getAssignment } from '@/features/groups/api/groups.api'
import { useGroupRouteItem } from '@/features/groups/composables/useGroupRouteResource'
import { uploadFile } from '@/shared/api/files.api'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()
const { item: assignment, groupId, itemId: assignmentId, error } = useGroupRouteItem('assignmentId', getAssignment)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const isSubmitting = ref(false)
const form = reactive({
  text: ''
})
const fileNames = computed(() => selectedFiles.value.map((file) => file.name).join(', '))

function handleFilesChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFiles.value = Array.from(input.files ?? [])
}

function clearFiles() {
  selectedFiles.value = []

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function validateForm() {
  if (form.text.trim().length === 0 && selectedFiles.value.length === 0) {
    notifications.error('Добавьте текст ответа или файл')
    return false
  }

  return true
}

async function submit() {
  if (!groupId.value || !assignmentId.value || !auth.accessToken || isSubmitting.value || !validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const uploadedFiles = []

    for (const file of selectedFiles.value) {
      uploadedFiles.push(await uploadFile(file, 'submissions', auth.accessToken))
    }

    await createSubmission(groupId.value, assignmentId.value, {
      text: form.text.trim() || undefined,
      fileIds: uploadedFiles.map((file) => file.id),
      status: 'SUBMITTED'
    }, auth.accessToken)

    notifications.success('Ответ отправлен')
    await router.push({ name: 'group-assignment-details', params: { groupId: groupId.value, assignmentId: assignmentId.value } })
  } catch (caught) {
    notifications.error(caught instanceof Error ? caught.message : 'Не удалось отправить ответ')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main v-if="assignment" class="page narrow-page">
    <AppPageHeader
      eyebrow="Ответ на задание"
      :title="assignment.title"
      description="Отправьте текстовое решение и при необходимости прикрепите файлы."
    />

    <form class="submission-form surface-panel" novalidate @submit.prevent="submit">
      <AppTextarea v-model="form.text" name="text" label="Ответ" placeholder="Опишите решение" :rows="8" />

      <label class="file-field">
        <span>
          <Paperclip :size="18" />
          Файлы
        </span>
        <strong>{{ fileNames || 'Выберите файлы' }}</strong>
        <input ref="fileInput" type="file" multiple @change="handleFilesChange">
      </label>

      <div v-if="selectedFiles.length > 0" class="selected-files">
        <span>{{ selectedFiles.length }} файлов выбрано</span>
        <button type="button" @click="clearFiles">
          <X :size="16" />
          Убрать
        </button>
      </div>

      <div class="submission-form__actions">
        <AppButton type="submit" :disabled="isSubmitting">
          <Send :size="18" />
          {{ isSubmitting ? 'Отправляем...' : 'Отправить ответ' }}
        </AppButton>
        <RouterLink :to="{ name: 'group-assignment-details', params: { groupId, assignmentId } }">Отмена</RouterLink>
      </div>
    </form>
  </main>

  <main v-else class="page narrow-page">
    <EmptyState title="Задание не загружено" :description="error ?? 'Данные задания ожидаются от API.'" />
  </main>
</template>

<style scoped>
.submission-form {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 36px);
}

.file-field {
  background: var(--color-surface-low);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: grid;
  gap: 8px;
  padding: 16px;
}

.file-field span {
  align-items: center;
  color: var(--color-text-muted);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 8px;
  text-transform: uppercase;
}

.file-field strong {
  color: var(--color-primary);
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-field input {
  display: none;
}

.selected-files {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.selected-files button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--color-error);
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  gap: 6px;
}

.submission-form__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.submission-form__actions a {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 720;
}

.submission-form__actions a:hover {
  color: var(--color-primary);
}
</style>
