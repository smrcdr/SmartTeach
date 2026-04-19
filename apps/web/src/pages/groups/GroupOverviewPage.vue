<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'верхняя сводка уже живет внутри отдельного group workspace layout',
  'здесь появятся owner, код группы, участники и быстрые переходы',
  'место для ближайших уроков, дедлайнов и событий уже выделено как отдельный экран',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Overview"
    title="Обзор группы"
    description="Каркас уже готов под операционную сводку группы без возврата к старому dashboard-мышлению."
    :highlights="highlights"
    next-step="Шаг 8 подключит реальный overview с данными группы, owner и ближайшими активностями."
    primary-action-label="К списку групп"
    primary-action-to="/groups"
  />
</template>
