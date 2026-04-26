<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import GroupCatalogCard from '@/features/groups/components/GroupCatalogCard.vue'
import { useGroups } from '@/features/groups/composables/useGroups'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const auth = useAuthStore()
const { groups, isLoading, error } = useGroups({ mine: true })
const initials = computed(() => auth.user?.displayName.slice(0, 1).toUpperCase() ?? '')
</script>

<template>
  <main class="page profile-page">
    <section v-if="auth.user" class="profile-card surface-panel">
      <img v-if="auth.user.avatarUrl" :src="auth.user.avatarUrl" :alt="auth.user.displayName" />
      <span v-else class="profile-card__initials">{{ initials }}</span>
      <div>
        <AppPageHeader
          eyebrow="Профиль"
          :title="auth.user.displayName"
          :description="auth.user.bio ?? undefined"
        />
        <strong>{{ auth.user.email }}</strong>
      </div>
    </section>

    <section class="profile-page__groups">
      <h2>Активные группы</h2>
      <GroupCatalogCard
        v-for="group in groups.slice(0, 2)"
        :key="group.id"
        :group="group"
        compact
      />
      <EmptyState
        v-if="!isLoading && !error && groups.length === 0"
        title="Групп пока нет"
        description="Список активных групп приходит из API."
      />
      <EmptyState v-if="error" title="Не удалось загрузить группы" :description="error" />
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

.profile-card img,
.profile-card__initials {
  border-radius: 50%;
  height: 140px;
  width: 140px;
}

.profile-card img {
  object-fit: cover;
}

.profile-card__initials {
  align-items: center;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  font-size: 3rem;
  font-weight: 900;
  justify-content: center;
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
