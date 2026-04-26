<script setup lang="ts">
import { currentUser } from '@/app/demo/demo-data'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page narrow-page">
    <section class="surface-panel public-profile">
      <img :src="currentUser.avatarUrl" :alt="currentUser.name" />
      <AppPageHeader eyebrow="Пользователь" :title="currentUser.name" :description="currentUser.bio" />
    </section>
  </main>
</template>

<style scoped>
.public-profile {
  align-items: center;
  display: grid;
  gap: 26px;
  grid-template-columns: 120px 1fr;
  padding: 34px;
}

.public-profile img {
  border-radius: 50%;
  height: 120px;
  object-fit: cover;
  width: 120px;
}

.public-profile :deep(.page-header) {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .public-profile {
    grid-template-columns: 1fr;
  }
}
</style>
