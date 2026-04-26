<script setup lang="ts">
import GroupHeroPanel from '@/features/groups/components/GroupHeroPanel.vue'
import ContentList from '@/features/groups/components/ContentList.vue'
import { listLessons } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { useGroupRouteList } from '@/features/groups/composables/useGroupRouteResource'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const { group, error } = useGroup()
const { items: lessons } = useGroupRouteList(listLessons)
</script>

<template>
  <main class="page group-preview">
    <GroupHeroPanel v-if="group" :group="group" />
    <EmptyState v-else-if="error" title="Не удалось загрузить группу" :description="error" />

    <ContentList v-if="group" title="Что внутри группы" eyebrow="Содержание">
      <article v-for="lesson in lessons" :key="lesson.id" class="preview-row">
        <div>
          <h3>{{ lesson.title }}</h3>
          <p>{{ lesson.content }}</p>
        </div>
        <StatusPill :label="lesson.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </article>
      <EmptyState
        v-if="lessons.length === 0"
        title="Уроки еще не опубликованы"
        description="Когда API вернет уроки этой группы, они появятся в этом списке."
      />
    </ContentList>
  </main>
</template>

<style scoped>
.group-preview {
  display: grid;
  gap: 34px;
}

.preview-row {
  align-items: center;
  background: var(--color-surface-lowest);
  border-radius: var(--radius-md);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  padding: 18px 20px;
}

.preview-row h3 {
  color: var(--color-primary);
  margin: 0 0 7px;
}

.preview-row p {
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
}
</style>
