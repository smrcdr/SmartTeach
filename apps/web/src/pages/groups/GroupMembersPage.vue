<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'layout уже готов под список участников и роль текущего пользователя',
  'место под public user profile и member actions выделено отдельным screen-level блоком',
  'раздел не завязан на старые course/class сущности и старые mock карточки',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Members"
    title="Участники"
    description="Здесь будет основной поток работы с ролями, составом группы и переходом в публичные профили."
    :highlights="highlights"
    next-step="Шаг 14 подключит members, join requests, transfer ownership и related admin actions."
    primary-action-label="Назад к обзору"
    primary-action-to="/groups/WEBSPRING26/overview"
  />
</template>
