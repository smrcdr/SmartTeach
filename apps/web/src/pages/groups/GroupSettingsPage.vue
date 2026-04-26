<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Администрирование" title="Настройки группы" description="Измените описание, доступ и включённые модули учебной группы." />
    <EditorialForm title-label="Название группы" description-label="Описание группы" submit-label="Сохранить настройки" />
  </main>
</template>
