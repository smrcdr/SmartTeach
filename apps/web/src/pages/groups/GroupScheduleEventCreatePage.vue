<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Календарь" title="Новое событие" description="Добавьте занятие, дедлайн или встречу в расписание группы." />
    <EditorialForm title-label="Название события" description-label="Место и детали" submit-label="Добавить событие" />
  </main>
</template>
