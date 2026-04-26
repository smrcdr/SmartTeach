<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader
      eyebrow="Новая область"
      title="Создать группу"
      description="Задайте название, описание и базовую структуру учебного пространства."
    />
    <EditorialForm submit-label="Создать группу" />
  </main>
</template>
