<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { listSubmissions } from '@/features/groups/api/groups.api'
import type { Submission } from '@/features/groups/api/groups.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { getSubmissionStatusLabel } from '@/features/groups/lib/status-labels'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const route = useRoute()
const auth = useAuthStore()
const submissions = ref<Submission[]>([])
const error = ref<string | null>(null)
const groupId = computed(() => String(route.params.groupId ?? ''))
const assignmentId = computed(() => String(route.params.assignmentId ?? ''))

async function refresh() {
  if (!groupId.value || !assignmentId.value || !auth.accessToken) {
    return
  }

  try {
    submissions.value = await listSubmissions(groupId.value, assignmentId.value, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить решения'
  }
}

watch([groupId, assignmentId], () => void refresh(), { immediate: true })
</script>

<template>
  <main class="page">
    <AppPageHeader eyebrow="Проверка" title="Проверка решений" description="Очередь отправленных работ, статусы ревью и оценки." />
    <ContentList title="Очередь проверки">
      <RouterLink
        v-for="submission in submissions"
        :key="submission.id"
        class="submission-link"
        :to="{ name: 'group-assignment-submission-details', params: { groupId, assignmentId, submissionId: submission.id } }"
      >
        <WorkspaceItem
          :title="submission.author.displayName"
          :description="submission.text ?? 'Решение без текстового комментария'"
          :meta="submission.submittedAt ? formatDateTime(submission.submittedAt) : `Попытка ${submission.attemptNumber}`"
        >
          <template #aside>
            <StatusPill :label="getSubmissionStatusLabel(submission.status)" :tone="submission.status === 'REVIEWED' ? 'success' : 'warning'" />
          </template>
        </WorkspaceItem>
      </RouterLink>
      <EmptyState
        v-if="submissions.length === 0 && !error"
        title="Решений пока нет"
        description="Список будет заполнен данными из API."
      />
      <EmptyState v-if="error" title="Не удалось загрузить решения" :description="error" />
    </ContentList>
  </main>
</template>

<style scoped>
.submission-link {
  display: block;
}
</style>
