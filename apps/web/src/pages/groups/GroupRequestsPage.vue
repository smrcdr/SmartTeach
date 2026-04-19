<script setup lang="ts">
import GroupSectionPlaceholder from '../../features/groups/components/GroupSectionPlaceholder.vue'

const highlights = [
  'раздел заранее вынесен в workspace и не смешан с каталогом',
  'каркас уже подразумевает owner/admin visibility для BY_REQUEST групп',
  'будущий review flow не потребует отдельного временного layout',
]
</script>

<template>
  <GroupSectionPlaceholder
    eyebrow="Workspace / Requests"
    title="Заявки"
    description="Экран предназначен для moderating join requests в группах с режимом BY_REQUEST."
    :highlights="highlights"
    next-step="Шаг 14 добавит list, approve/reject actions и role-based visibility для owner/admin."
    primary-action-label="К разделу участников"
    primary-action-to="/groups/WEBSPRING26/members"
  />
</template>
