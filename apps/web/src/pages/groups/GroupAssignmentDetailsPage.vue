<script setup lang="ts">
import { ClipboardCheck, Send } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { getAssignment, listSubmissions, type Submission } from '@/features/groups/api/groups.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteItem } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime, formatShortDate } from '@/shared/lib/date'

const auth = useAuthStore()
const { group } = useGroup()
const { item: assignment, groupId, itemId: assignmentId, error } = useGroupRouteItem('assignmentId', getAssignment)
const canManage = computed(() => canManageGroup(group.value))
const submissions = ref<Submission[]>([])
const submissionsError = ref<string | null>(null)
const targetLabel = computed(() => {
  if (!assignment.value) {
    return null
  }

  if (assignment.value.lessonId) {
    return 'Привязано к уроку'
  }

  if (assignment.value.materialSubsectionId) {
    return 'Привязано к подразделу'
  }

  if (assignment.value.materialSectionId) {
    return 'Привязано к разделу'
  }

  return 'Без привязки к материалам'
})

async function refreshSubmissions() {
  if (!groupId.value || !assignmentId.value || !auth.accessToken) {
    return
  }

  try {
    submissions.value = await listSubmissions(groupId.value, assignmentId.value, auth.accessToken, {
      mineOnly: true
    })
  } catch (caught) {
    submissionsError.value = caught instanceof Error ? caught.message : 'Не удалось загрузить ваши ответы'
  }
}

watch([groupId, assignmentId, () => auth.accessToken], () => void refreshSubmissions(), { immediate: true })
</script>

<template>
  <main v-if="assignment" class="page narrow-page">
    <AppPageHeader
      eyebrow="Задание"
      :title="assignment.title"
      :description="assignment.dueAt ? `Дедлайн ${formatShortDate(assignment.dueAt)}.` : assignment.content ?? undefined"
      align="split"
    >
      <template #actions>
        <RouterLink
          v-if="canManage"
          :to="{ name: 'group-assignment-submissions', params: { groupId, assignmentId } }"
        >
          <AppButton variant="secondary">
            <ClipboardCheck :size="18" />
            Проверить ответы
          </AppButton>
        </RouterLink>
        <RouterLink
          v-else
          :to="{ name: 'group-assignment-submit', params: { groupId, assignmentId } }"
        >
          <AppButton>
            <Send :size="18" />
            Отправить ответ
          </AppButton>
        </RouterLink>
        <StatusPill :label="assignment.status" :tone="assignment.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </template>
    </AppPageHeader>

    <section class="surface-panel assignment-panel">
      <div class="assignment-panel__meta">
        <span>{{ targetLabel }}</span>
        <span v-if="assignment.maxScore !== null">{{ assignment.maxScore }} баллов</span>
      </div>
      <p>{{ assignment.content ?? 'Описание задания пока не заполнено.' }}</p>
      <div v-if="assignment.files.length > 0" class="assignment-panel__files">
        <a
          v-for="file in assignment.files"
          :key="file.id"
          :href="file.url"
          target="_blank"
          rel="noreferrer"
        >
          {{ file.originalName }}
        </a>
      </div>
    </section>

    <section v-if="!canManage" class="surface-panel submissions-panel">
      <header>
        <h2>Мои ответы</h2>
        <RouterLink :to="{ name: 'group-assignment-submit', params: { groupId, assignmentId } }">
          <AppButton variant="secondary" size="sm">Новая попытка</AppButton>
        </RouterLink>
      </header>

      <div v-if="submissions.length > 0" class="submission-list">
        <article v-for="submission in submissions" :key="submission.id" class="submission-row">
          <div>
            <strong>Попытка {{ submission.attemptNumber }}</strong>
            <span>{{ submission.submittedAt ? formatDateTime(submission.submittedAt) : 'Черновик' }}</span>
          </div>
          <StatusPill
            :label="submission.status"
            :tone="submission.status === 'REVIEWED' ? 'success' : submission.status === 'SUBMITTED' ? 'warning' : 'muted'"
          />
        </article>
      </div>
      <EmptyState
        v-else-if="!submissionsError"
        title="Ответов пока нет"
        description="Отправьте решение, чтобы преподаватель смог его проверить."
      />
      <EmptyState v-if="submissionsError" title="Не удалось загрузить ответы" :description="submissionsError" />
    </section>
  </main>
  <main v-else class="page narrow-page">
    <EmptyState title="Задание не загружено" :description="error ?? 'Данные задания ожидаются от API.'" />
  </main>
</template>

<style scoped>
.assignment-panel,
.submissions-panel {
  display: grid;
  gap: 22px;
  padding: 30px;
}

.assignment-panel__meta {
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.82rem;
  font-weight: 800;
}

.assignment-panel__meta span {
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}

.assignment-panel p {
  color: var(--color-text-muted);
  line-height: 1.65;
  margin: 0;
}

.assignment-panel__files {
  border-top: 1px solid var(--color-divider);
  display: grid;
  gap: 10px;
  padding-top: 18px;
}

.assignment-panel__files a {
  color: var(--color-primary);
  font-weight: 780;
}

.assignment-panel__files a:hover {
  text-decoration: underline;
}

.submissions-panel header {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.submissions-panel h2 {
  color: var(--color-primary);
  font-size: 1.25rem;
  margin: 0;
}

.submission-list {
  display: grid;
  gap: 10px;
}

.submission-row {
  align-items: center;
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  display: flex;
  gap: 14px;
  justify-content: space-between;
  padding: 14px 16px;
}

.submission-row div {
  display: grid;
  gap: 4px;
}

.submission-row strong {
  color: var(--color-text);
}

.submission-row span {
  color: var(--color-text-muted);
  font-size: 0.86rem;
}

@media (max-width: 680px) {
  .submissions-panel header,
  .submission-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
