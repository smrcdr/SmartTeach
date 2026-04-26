<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Урок" title="Редактировать урок" description="Обновите содержание и статус публикации." />
    <EditorialForm title-label="Тема урока" submit-label="Сохранить урок" />
  </main>
</template>
