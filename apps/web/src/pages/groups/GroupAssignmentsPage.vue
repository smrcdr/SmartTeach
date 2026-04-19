<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'экран уже изолирован от уроков и будущих submission views',
  'каркас учитывает список, admin view и историю попыток как отдельные состояния',
  'route готов для связки с уроком или standalone assignment внутри группы',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Assignments"
    title="Задания"
    description="Здесь появится основной список заданий с due date, связью с уроком и веткой review flow для admin role."
    :highlights="highlights"
    next-step="Шаги 10 и 11 последовательно подключат assignment CRUD и submission/review сценарии."
    primary-action-label="К разделу групп"
    primary-action-to="/groups"
  />
</template>
