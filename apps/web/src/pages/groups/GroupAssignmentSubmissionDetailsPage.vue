<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSubmission } from '@/features/groups/api/groups.api'
import type { Submission } from '@/features/groups/api/groups.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const route = useRoute()
const auth = useAuthStore()
const submission = ref<Submission | null>(null)
const error = ref<string | null>(null)
const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))
const submissionId = computed(() => String(route.params.submissionId ?? ''))

async function refresh() {
  if (!groupId.value || !assignmentId.value || !submissionId.value || !auth.accessToken) {
    return
  }

  try {
    submission.value = await getSubmission(groupId.value, assignmentId.value, submissionId.value, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить решение'
  }
}

watch([groupId, assignmentId, submissionId], () => void refresh(), { immediate: true })
</script>

<template>
  <main v-if="submission" class="page narrow-page">
    <AppPageHeader
      eyebrow="Решение"
      :title="submission.author.displayName"
      :description="submission.text ?? 'Решение без текстового комментария'"
    />
    <EditorialForm title-label="Оценка" description-label="Комментарий преподавателя" submit-label="Сохранить проверку" />
  </main>
  <main v-else class="page narrow-page">
    <EmptyState title="Решение не загружено" :description="error ?? 'Данные решения ожидаются от API.'" />
  </main>
</template>
