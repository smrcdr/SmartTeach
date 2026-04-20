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
    <section class="intro catalog-intro">
      <h1>Публичный профиль</h1>
      <p class="intro-copy">
        Нейтральная карточка пользователя, из которой можно быстро понять контекст и начать личный диалог.
      </p>
    </section>

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

    <div v-else-if="profile" class="profile-layout">
      <aside class="profile-hero">
        <div class="public-profile__avatar">
          <img
            v-if="profile.avatarUrl"
            :src="profile.avatarUrl"
            :alt="profile.displayName"
            class="public-profile__avatar-image"
          />
          <span v-else>{{ getUserInitials(profile.displayName) }}</span>
        </div>

        <h2>{{ profile.displayName }}</h2>
        <p class="profile-role">Пользователь SmartTeach</p>
        <p class="profile-bio">
          {{ normalizeOptionalText(profile.bio) || 'Пользователь пока не добавил публичное описание.' }}
        </p>

        <div class="public-profile__actions">
          <AppButton v-if="isCurrentUser" to="/profile" variant="secondary">Мой профиль</AppButton>
          <UserDirectChatButton v-else :user-id="profile.id" label="Написать" />
        </div>
      </aside>

      <AppCard class="profile-panel">
        <div class="profile-panel-header">
          <h2>Контекст</h2>
        </div>

        <div class="profile-info-grid">
          <article class="profile-info-item">
            <span>Имя</span>
            <strong>{{ profile.displayName }}</strong>
          </article>
          <article class="profile-info-item">
            <span>Идентификатор</span>
            <strong>{{ profile.id }}</strong>
          </article>
          <article class="profile-info-item">
            <span>Описание</span>
            <strong>{{ normalizeOptionalText(profile.bio) || 'Пока пусто' }}</strong>
          </article>
          <article class="profile-info-item">
            <span>Диалог</span>
            <strong>{{ isCurrentUser ? 'Это ваш профиль' : 'Можно открыть личный чат' }}</strong>
          </article>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.public-profile__avatar {
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  margin: 0 auto;
  background: #dff0fb;
  color: #1d8fe0;
  font-size: 1.4rem;
  font-weight: 800;
}

.public-profile__avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.public-profile__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 18px;
}
</style>
