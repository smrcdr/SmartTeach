<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Задание" title="Редактировать задание" description="Обновите условие, дедлайн и статус задания." />
    <EditorialForm title-label="Название задания" description-label="Условие" submit-label="Сохранить задание" />
  </main>
</template>
