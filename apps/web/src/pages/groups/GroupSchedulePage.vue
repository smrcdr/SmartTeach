<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'route уже выделен под agenda-экран, а не под декоративный календарный mock',
  'в layout заложено место под быстрые фильтры типов событий',
  'поток custom events можно добавить без перестройки app shell',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Schedule"
    title="Расписание"
    description="Скелет рассчитан на дневную agenda-ленту, где смешиваются уроки, дедлайны и кастомные события."
    :highlights="highlights"
    next-step="Шаг 12 подключит реальные schedule endpoints, фильтры и CRUD кастомных событий."
    primary-action-label="Открыть обзор"
    primary-action-to="/groups/WEBSPRING26/overview"
  />
</template>
