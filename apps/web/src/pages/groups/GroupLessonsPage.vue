<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'для уроков уже есть отдельный route внутри workspace',
  'layout готов под filters, status chips и ручную сортировку',
  'место под full-page create/edit flow отделено от общего списка',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Lessons"
    title="Уроки"
    description="Раздел подготовлен под реальный lessons module, где дата — метаданные, а основной список строится по sortOrder."
    :highlights="highlights"
    next-step="Шаг 9 подключит lessons CRUD, фильтры по статусу и отдельные формы создания/редактирования."
    primary-action-label="Обзор группы"
    primary-action-to="/groups/WEBSPRING26/overview"
  />
</template>
