<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Календарь" title="Редактировать событие" description="Обновите время, место и статус события." />
    <EditorialForm title-label="Название события" description-label="Место и детали" submit-label="Сохранить событие" />
  </main>
</template>
