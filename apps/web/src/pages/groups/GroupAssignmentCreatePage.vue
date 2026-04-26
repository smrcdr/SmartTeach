<script setup lang="ts">
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Задание" title="Новое задание" description="Сформулируйте задачу, дедлайн и критерии сдачи." />
      <EditorialForm title-label="Название задания" description-label="Условие" submit-label="Создать задание" />
    </main>
  </GroupAdminOnly>
</template>
