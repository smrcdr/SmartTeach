<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'навигация уже выделяет настройки как отдельный admin-раздел',
  'в каркасе есть место под module toggles, archive flow и leave/ownership actions',
  'route уже отделен от общего списка групп и overview',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Settings"
    title="Настройки группы"
    description="Этот экран подготовлен под все owner/admin actions без смешения с рабочими student flows."
    :highlights="highlights"
    next-step="Шаг 14 подключит group settings, archive/restore, leave flow и transfer ownership."
    primary-action-label="Вернуться к группе"
    primary-action-to="/groups/WEBSPRING26/overview"
  />
</template>
