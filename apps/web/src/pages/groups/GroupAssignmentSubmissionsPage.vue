<script setup lang="ts">
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
</script>

<template>
  <main class="page">
    <AppPageHeader eyebrow="Проверка" title="Проверка решений" description="Очередь отправленных работ, статусы ревью и оценки." />
    <ContentList title="Очередь проверки">
      <WorkspaceItem title="Мила Орлова" description="Решение отправлено с двумя файлами" meta="Сегодня">
        <template #aside><StatusPill label="Review" tone="warning" /></template>
      </WorkspaceItem>
      <WorkspaceItem title="Данил Ким" description="Черновик ответа ожидает отправки" meta="Вчера">
        <template #aside><StatusPill label="Draft" tone="muted" /></template>
      </WorkspaceItem>
    </ContentList>
  </main>
</template>
