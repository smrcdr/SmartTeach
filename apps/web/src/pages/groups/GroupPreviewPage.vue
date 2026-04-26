<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getDemoGroup } from '@/app/demo/demo-data'
import GroupHeroPanel from '@/features/groups/components/GroupHeroPanel.vue'
import ContentList from '@/features/groups/components/ContentList.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'

const route = useRoute()
const group = computed(() => getDemoGroup(String(route.params.groupId))!)
</script>

<template>
  <main class="page group-preview">
    <GroupHeroPanel :group="group" />

    <ContentList title="Что внутри группы" eyebrow="Содержание">
      <article v-for="lesson in group.lessons" :key="lesson.id" class="preview-row">
        <div>
          <h3>{{ lesson.title }}</h3>
          <p>{{ lesson.summary }}</p>
        </div>
        <StatusPill :label="lesson.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'" :tone="lesson.status === 'PUBLISHED' ? 'success' : 'muted'" />
      </article>
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
