<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import UserDirectChatButton from '../../features/chats/components/UserDirectChatButton.vue'
import { useAuth } from '../../features/auth/composables/useAuth'
import { getProfileErrorMessage } from '../../features/profile/api/profile.api'
import { usePublicProfile } from '../../features/profile/composables/useProfiles'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'
import { getUserInitials, normalizeOptionalText } from '../../shared/lib/user-profile'

const route = useRoute()
const { currentUser } = useAuth()

const userId = computed(() => String(route.params.userId ?? ''))
const publicProfileQuery = usePublicProfile(userId)
const profile = computed(() => publicProfileQuery.data.value ?? null)
const isCurrentUser = computed(() => currentUser.value?.id === userId.value)
const errorMessage = computed(() => {
  const error = publicProfileQuery.error.value

  return error ? getProfileErrorMessage(error, 'Не удалось загрузить профиль пользователя') : ''
})
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Users / Public Profile</span>
      <h1 class="page-title">Публичный профиль остается коротким и служит честной точкой входа в direct chat.</h1>
      <p class="page-lead">
        Здесь нет вымышленных полей, только те данные, которые реально доступны через backend: имя, bio и avatar.
      </p>
    </header>

    <AppLoader v-if="publicProfileQuery.isPending.value" label="Открываем публичный профиль пользователя" />

    <AppErrorState
      v-else-if="errorMessage"
      title="Не удалось открыть профиль"
      :description="errorMessage"
    >
      <template #actions>
        <AppButton to="/chats" variant="secondary">К чатам</AppButton>
      </template>
    </AppErrorState>

    <div v-else-if="profile" class="section-grid">
      <AppCard class="span-5 public-profile">
        <div class="public-profile__identity">
          <div class="public-profile__avatar">
            <img
              v-if="profile.avatarUrl"
              :src="profile.avatarUrl"
              :alt="profile.displayName"
              class="public-profile__avatar-image"
            />
            <span v-else>{{ getUserInitials(profile.displayName) }}</span>
          </div>

          <div class="public-profile__copy">
            <h2 class="public-profile__name">{{ profile.displayName }}</h2>
            <p class="muted">
              {{ normalizeOptionalText(profile.bio) || 'Пользователь пока не добавил публичное bio.' }}
            </p>
          </div>
        </div>

        <div class="public-profile__actions">
          <AppButton v-if="isCurrentUser" to="/profile" variant="secondary">Мой профиль</AppButton>
          <UserDirectChatButton v-else :user-id="profile.id" label="Написать" />
        </div>
      </AppCard>

      <AppCard tone="accent" class="span-7">
        <h2 class="public-profile__section-title">Контекст</h2>
        <p class="muted">
          Этот маршрут нужен как нейтральная точка входа в личный диалог: его можно открыть из карточки участника,
          из author блока у submission и из других мест, где уже известен `userId`.
        </p>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.public-profile {
  gap: 1.4rem;
}

.public-profile__identity {
  display: grid;
  gap: 1rem;
}

.public-profile__avatar {
  display: grid;
  place-items: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: rgba(31, 117, 156, 0.14);
  color: var(--color-accent-strong);
  font-size: 1.2rem;
  font-weight: 800;
}

.public-profile__avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.public-profile__copy {
  display: grid;
  gap: 0.4rem;
}

.public-profile__name,
.public-profile__section-title {
  font-size: 1.12rem;
  letter-spacing: -0.02em;
}

.public-profile__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
