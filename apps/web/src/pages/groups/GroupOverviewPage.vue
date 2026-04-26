<script setup lang="ts">
import { BookOpen, CalendarDays, ClipboardList, MessageCircle } from 'lucide-vue-next'
import { listAssignments, listLessons, listScheduleEvents } from '@/features/groups/api/groups.api'
import { listGroupChats } from '@/features/chats/api/chats.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import MetricTile from '@/shared/ui/MetricTile.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

const { group, error } = useGroup()
const { items: lessons } = useGroupRouteList(listLessons)
const { items: assignments } = useGroupRouteList(listAssignments)
const { items: schedule } = useGroupRouteList(listScheduleEvents)
const { items: chats } = useGroupRouteList(listGroupChats)
</script>

<template>
  <main v-if="group" class="page workspace-page">
    <AppPageHeader
      eyebrow="Рабочая область"
      :title="group.name"
      :description="group.description ?? undefined"
      align="split"
    >
      <template #actions>
        <StatusPill label="Active" tone="success" />
      </template>
    </AppPageHeader>

    <section class="workspace-page__metrics">
      <MetricTile label="Уроков" :value="lessons.length" detail="Опубликованные и черновики" :icon="BookOpen" />
      <MetricTile label="Заданий" :value="assignments.length" detail="Активные проверки" :icon="ClipboardList" />
      <MetricTile label="Событий" :value="schedule.length" detail="Ближайшие встречи" :icon="CalendarDays" />
      <MetricTile label="Чатов" :value="chats.length" detail="Коммуникация группы" :icon="MessageCircle" />
    </section>

    <div class="workspace-page__grid">
      <ContentList title="Последние уроки">
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

      <ContentList title="Ближайшее">
        <WorkspaceItem
          v-for="event in schedule"
          :key="event.id"
          :title="event.title"
          :description="event.location ?? event.description ?? undefined"
          :meta="formatDateTime(event.startsAt)"
        >
          <template #aside>
            <StatusPill label="Planned" tone="primary" />
          </template>
        </WorkspaceItem>
        <EmptyState v-if="schedule.length === 0" title="Событий пока нет" />
      </ContentList>
    </div>
  </main>
  <main v-else class="page">
    <EmptyState title="Не удалось загрузить группу" :description="error ?? 'Данные группы ожидаются от API.'" />
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
