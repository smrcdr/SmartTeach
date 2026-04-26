<script setup lang="ts">
import { currentUser, myGroups } from '@/app/demo/demo-data'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
</script>

<template>
  <main class="page profile-page">
    <section class="profile-card surface-panel">
      <img :src="currentUser.avatarUrl" :alt="currentUser.name" />
      <div>
        <AppPageHeader
          eyebrow="Профиль"
          :title="currentUser.name"
          :description="currentUser.bio"
        />
        <strong>{{ currentUser.role }}</strong>
      </div>
    </section>

    <section class="profile-page__groups">
      <h2>Активные группы</h2>
      <GroupCatalogCard
        v-for="group in myGroups.slice(0, 2)"
        :key="group.id"
        :group="group"
        compact
      />
    </section>
  </main>
</template>

<style scoped>
.profile-card {
  align-items: center;
  display: grid;
  gap: 28px;
  grid-template-columns: 140px 1fr;
  margin-bottom: 36px;
  padding: clamp(24px, 4vw, 42px);
}

.profile-card img {
  border-radius: 50%;
  height: 140px;
  object-fit: cover;
  width: 140px;
}

.profile-card :deep(.page-header) {
  margin-bottom: 16px;
}

.profile-card strong {
  color: var(--color-primary);
}

.profile-page__groups {
  display: grid;
  gap: 22px;
}

.profile-page__groups h2 {
  color: var(--color-primary);
  margin: 0;
}

@media (max-width: 700px) {
  .profile-card {
    grid-template-columns: 1fr;
  }
}
</style>
