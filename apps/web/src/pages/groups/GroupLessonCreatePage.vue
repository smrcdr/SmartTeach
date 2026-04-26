<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Урок" title="Новый урок" description="Создайте материал с описанием, статусом и связями с заданиями." />
    <EditorialForm title-label="Тема урока" submit-label="Создать урок" />
  </main>
</template>
