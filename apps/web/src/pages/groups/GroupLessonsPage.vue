<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const group = useDemoGroup()
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
        <RouterLink :to="{ name: 'group-lesson-create', params: { groupId: group.id } }">
          <AppButton><Plus :size="18" /> Новый урок</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <ContentList title="Учебный план">
      <WorkspaceItem
        v-for="lesson in group.lessons"
        :key="lesson.id"
        :title="lesson.title"
        :description="lesson.summary"
        :meta="lesson.duration"
      >
        <template #aside>
          <StatusPill :label="lesson.status === 'PUBLISHED' ? 'Published' : 'Draft'" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
        </template>
      </WorkspaceItem>
    </ContentList>
  </main>
</template>
