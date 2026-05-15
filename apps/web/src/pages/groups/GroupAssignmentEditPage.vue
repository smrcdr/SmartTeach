<script setup lang="ts">
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Задание" title="Редактировать задание" description="Обновите условие, дедлайн и статус задания." />
      <EditorialForm title-label="Название задания" description-label="Условие" submit-label="Сохранить задание" />
    </main>
  </GroupAdminOnly>
</template>
