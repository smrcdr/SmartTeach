<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUser } from '@/features/users/api/users.api'
import type { PublicUser } from '@/features/users/api/users.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const route = useRoute()
const auth = useAuthStore()
const user = ref<PublicUser | null>(null)
const error = ref<string | null>(null)
const userId = computed(() => String(route.params.userId ?? ''))
const initials = computed(() => user.value?.displayName.slice(0, 1).toUpperCase() ?? '')

async function refresh() {
  if (!userId.value || !auth.accessToken) {
    return
  }

  error.value = null

  try {
    user.value = await getUser(userId.value, auth.accessToken)
  } catch (caught) {
    user.value = null
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить пользователя'
  }
}

watch([userId, () => auth.accessToken], () => void refresh(), { immediate: true })
</script>

<template>
  <main class="page narrow-page">
    <section v-if="user" class="surface-panel public-profile">
      <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" />
      <span v-else class="public-profile__initials">{{ initials }}</span>
      <AppPageHeader eyebrow="Пользователь" :title="user.displayName" :description="user.bio ?? undefined" />
    </section>
    <EmptyState v-else title="Пользователь не загружен" :description="error ?? 'Профиль ожидается от API.'" />
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

.public-profile img,
.public-profile__initials {
  border-radius: 50%;
  height: 120px;
  width: 120px;
}

.public-profile img {
  object-fit: cover;
}

.public-profile__initials {
  align-items: center;
  background: var(--color-primary);
  color: #fff;
  display: inline-flex;
  font-size: 2.4rem;
  font-weight: 900;
  justify-content: center;
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
