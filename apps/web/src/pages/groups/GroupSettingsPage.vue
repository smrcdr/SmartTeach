<script setup lang="ts">
import GroupAdminOnly from '@/features/groups/components/GroupAdminOnly.vue'
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <GroupAdminOnly>
    <main class="page narrow-page">
      <AppPageHeader eyebrow="Администрирование" title="Настройки группы" description="Измените описание, доступ и включённые модули учебной группы." />
      <EditorialForm title-label="Название группы" description-label="Описание группы" submit-label="Сохранить настройки" />
    </main>
  </GroupAdminOnly>
</template>
