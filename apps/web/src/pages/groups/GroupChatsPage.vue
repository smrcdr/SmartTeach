<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'чат группы уже имеет отдельный route внутри workspace',
  'каркас не смешивает локальные group chats с глобальным разделом чатов',
  'mobile navigation уже учитывает быстрый вход в этот раздел через drawer',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Chats"
    title="Чаты группы"
    description="Этот экран подготовлен под список тредов, сообщения и composer для group-level discussion flow."
    :highlights="highlights"
    next-step="Шаг 13 подключит chat list, создание групповых чатов и message composer поверх websocket transport."
    primary-action-label="Глобальные чаты"
    primary-action-to="/chats"
  />
</template>
