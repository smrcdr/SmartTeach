<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NavItem, UserProfile } from '../types/dashboard'
import logoMark from '../assets/smarteach-logo-light.png'

const props = defineProps<{
  items: NavItem[]
  user: UserProfile
}>()

const route = useRoute()
const router = useRouter()
const headerSearchQuery = ref('')

const normalizedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    active: route.path === item.to,
  })),
)

const submitHeaderSearch = async () => {
  const query = headerSearchQuery.value.trim()
  if (!query) return

  await router.push({
    path: '/catalog',
    query: { q: query },
  })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-start">
      <div class="brand">
        <img class="brand-logo" :src="logoMark" alt="SmartTeach" />
        <div class="brand-copy">
          <strong>SmartTeach</strong>
        </div>
      </div>

      <nav class="topbar-nav" aria-label="Основная навигация">
        <RouterLink
          v-for="item in normalizedItems"
          :key="item.label"
          :to="item.to"
          class="nav-link"
          :class="{ active: item.active }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <div class="topbar-tools">
      <label class="search-field" aria-label="Поиск по группам">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          v-model="headerSearchQuery"
          type="text"
          placeholder="Поиск групп..."
          @keydown.enter="submitHeaderSearch"
        />
      </label>

      <RouterLink to="/create-group" class="create-group-btn">Создать группу</RouterLink>

      <button class="notification-btn" type="button" aria-label="Уведомления">
        <span class="material-symbols-outlined">notifications</span>
        <span class="notification-badge">3</span>
      </button>

      <button class="profile-chip" type="button">
        <img :src="user.avatar" :alt="user.name" />
        <span>{{ user.name }}</span>
      </button>
    </div>
  </header>
</template>
