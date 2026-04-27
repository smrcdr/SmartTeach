<script setup lang="ts">
import { Edit } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { getLesson } from '@/features/groups/api/groups.api'
import LessonReferenceDialog from '@/features/groups/components/LessonReferenceDialog.vue'
import MarkdownPreview from '@/features/groups/components/MarkdownPreview.vue'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteItem } from '@/features/groups/composables/useGroupRouteResource'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { getLessonStatusLabel } from '@/features/groups/lib/status-labels'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const auth = useAuthStore()
const { group } = useGroup()
const { item: lesson, groupId, itemId: lessonId, error } = useGroupRouteItem('lessonId', getLesson)
const canManage = computed(() => canManageGroup(group.value))
const previewLessonId = ref<string | null>(null)
</script>

<template>
  <main v-if="lesson" class="page narrow-page">
    <AppPageHeader eyebrow="Материал" :title="lesson.title" align="split">
      <template #actions>
        <RouterLink v-if="canManage" :to="{ name: 'group-lesson-edit', params: { groupId, lessonId } }">
          <AppButton variant="secondary">
            <Edit :size="18" />
            Редактировать
          </AppButton>
        </RouterLink>
        <StatusPill :label="getLessonStatusLabel(lesson.status)" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </template>
    </AppPageHeader>
    <section class="reading-panel surface-panel">
      <MarkdownPreview
        :content="lesson.content"
        handle-lesson-links
        @lesson-link="previewLessonId = $event"
      />
      <div v-if="lesson.files.length > 0" class="reading-panel__files">
        <a
          v-for="file in lesson.files"
          :key="file.id"
          :href="file.url"
          target="_blank"
          rel="noreferrer"
        >
          {{ file.originalName }}
        </a>
      </div>
    </section>
    <LessonReferenceDialog
      v-if="previewLessonId"
      :group-id="groupId"
      :lesson-id="previewLessonId"
      :token="auth.accessToken"
      @close="previewLessonId = null"
    />
  </main>
  <main v-else class="page narrow-page">
    <EmptyState title="Урок не загружен" :description="error ?? 'Данные урока ожидаются от API.'" />
  </main>
</template>

<style scoped>
.reading-panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.reading-panel__files {
  border-top: 1px solid var(--color-divider);
  display: grid;
  gap: 10px;
  padding-top: 18px;
}

.reading-panel__files a {
  color: var(--color-primary);
  font-weight: 780;
}

.reading-panel__files a:hover {
  text-decoration: underline;
}
</style>
