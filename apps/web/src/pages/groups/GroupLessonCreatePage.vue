<script setup lang="ts">
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Урок" title="Новый урок" description="Создайте материал с описанием, статусом и связями с заданиями." />
      <EditorialForm title-label="Тема урока" submit-label="Создать урок" />
    </main>
  </GroupAdminOnly>
</template>
