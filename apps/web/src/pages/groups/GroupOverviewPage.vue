<script setup lang="ts">
import { BookOpen, CalendarDays, ClipboardList, MessageCircle } from 'lucide-vue-next'
import { useDemoGroup } from '@/features/groups/composables/useDemoGroup'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const group = useDemoGroup()
</script>

<template>
  <main class="page workspace-page">
    <AppPageHeader
      eyebrow="Рабочая область"
      :title="group.title"
      :description="group.description"
      align="split"
    >
      <template #actions>
        <StatusPill label="Active" tone="success" />
      </template>
    </AppPageHeader>

    <section class="workspace-page__metrics">
      <MetricTile label="Уроков" :value="group.lessons.length" detail="Опубликованные и черновики" :icon="BookOpen" />
      <MetricTile label="Заданий" :value="group.assignments.length" detail="Активные проверки" :icon="ClipboardList" />
      <MetricTile label="Событий" :value="group.schedule.length" detail="Ближайшие встречи" :icon="CalendarDays" />
      <MetricTile label="Чатов" :value="group.chats.length" detail="Коммуникация группы" :icon="MessageCircle" />
    </section>

    <div class="workspace-page__grid">
      <ContentList title="Последние уроки">
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

      <ContentList title="Ближайшее">
        <WorkspaceItem
          v-for="event in group.schedule"
          :key="event.id"
          :title="event.title"
          :description="event.place"
          :meta="formatDateTime(event.startsAt)"
        >
          <template #aside>
            <StatusPill label="Planned" tone="primary" />
          </template>
        </WorkspaceItem>
      </ContentList>
    </div>
  </main>
</template>

<style scoped>
.workspace-page__metrics {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 28px;
}

.workspace-page__grid {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
}

@media (max-width: 1080px) {
  .workspace-page__metrics,
  .workspace-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
