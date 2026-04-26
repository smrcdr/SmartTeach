<script setup lang="ts">
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Календарь" title="Редактировать событие" description="Обновите время, место и статус события." />
      <EditorialForm title-label="Название события" description-label="Место и детали" submit-label="Сохранить событие" />
    </main>
  </GroupAdminOnly>
</template>
