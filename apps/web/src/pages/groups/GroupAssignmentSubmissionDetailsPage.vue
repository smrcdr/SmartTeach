<script setup lang="ts">
import EditorialForm from '@/features/groups/components/EditorialForm.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <AppPageHeader eyebrow="Решение" title="Проверка решения" description="Оставьте обратную связь, статус и оценку по отправленной работе." />
    <EditorialForm title-label="Оценка" description-label="Комментарий преподавателя" submit-label="Сохранить проверку" />
  </main>
</template>
