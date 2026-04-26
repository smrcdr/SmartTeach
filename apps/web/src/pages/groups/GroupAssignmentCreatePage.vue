<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Задание" title="Новое задание" description="Сформулируйте задачу, дедлайн и критерии сдачи." />
    <EditorialForm title-label="Название задания" description-label="Условие" submit-label="Создать задание" />
  </main>
</template>
