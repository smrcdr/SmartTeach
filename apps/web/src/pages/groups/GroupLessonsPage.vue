<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { listLessons } from '@/features/groups/api/groups.api'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const { items: lessons, groupId } = useGroupRouteList(listLessons)
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Материалы"
      title="Уроки"
      description="Структурированные материалы группы с черновиками и опубликованными занятиями."
      align="split"
    >
      <template #actions>
        <RouterLink :to="{ name: 'group-lesson-create', params: { groupId } }">
          <AppButton><Plus :size="18" /> Новый урок</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <ContentList title="Учебный план">
      <WorkspaceItem
        v-for="lesson in lessons"
        :key="lesson.id"
        :title="lesson.title"
        :description="lesson.content ?? undefined"
        :meta="lesson.startsAt ? formatDateTime(lesson.startsAt) : undefined"
      >
        <template #aside>
          <StatusPill :label="lesson.status === 'PUBLISHED' ? 'Published' : 'Draft'" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
        </template>
      </WorkspaceItem>
      <EmptyState v-if="lessons.length === 0" title="Уроков пока нет" />
    </ContentList>
  </main>
</template>
