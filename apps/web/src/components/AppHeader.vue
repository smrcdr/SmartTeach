<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NavItem, UserProfile } from '../types/dashboard'
import logoMark from '../assets/smarteach-logo-light.png'

const props = defineProps<{
  items: NavItem[]
  user: UserProfile
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  toggleTheme: []
}>()

const route = useRoute()
const router = useRouter()
const headerSearchQuery = ref('')
const profileMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)
const mobileNavOpen = ref(false)

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

const themeIcon = computed(() => (props.theme === 'dark' ? 'light_mode' : 'dark_mode'))
const themeLabel = computed(() =>
  props.theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему',
)

const toggleProfileMenu = () => {
  profileMenuOpen.value = !profileMenuOpen.value
}

const openProfilePage = async () => {
  profileMenuOpen.value = false
  mobileNavOpen.value = false
  await router.push('/profile')
}

const logout = () => {
  profileMenuOpen.value = false
  mobileNavOpen.value = false
}

const closeMobileNav = () => {
  mobileNavOpen.value = false
}

const toggleMobileNav = () => {
  mobileNavOpen.value = !mobileNavOpen.value
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null

  if (!target || !profileMenuRef.value?.contains(target)) {
    profileMenuOpen.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    profileMenuOpen.value = false
    mobileNavOpen.value = false
  },
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <header class="topbar">
    <div class="topbar-brand-row">
      <div class="topbar-start">
        <div class="brand">
          <img class="brand-logo" :src="logoMark" alt="SmartTeach" />
          <div class="brand-copy">
            <strong>SmartTeach</strong>
          </div>
        </div>

        <nav class="topbar-nav topbar-nav-desktop" aria-label="Основная навигация">
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

      <button
        type="button"
        class="mobile-menu-btn"
        :aria-expanded="mobileNavOpen"
        aria-label="Открыть меню"
        @click="toggleMobileNav"
      >
        <span class="material-symbols-outlined">{{ mobileNavOpen ? 'close' : 'menu' }}</span>
      </button>
    </div>

    <div class="topbar-tools topbar-tools-desktop">
      <button
        class="theme-toggle-btn"
        type="button"
        :aria-label="themeLabel"
        :title="themeLabel"
        @click="emit('toggleTheme')"
      >
        <span class="material-symbols-outlined">{{ themeIcon }}</span>
      </button>

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

      <div ref="profileMenuRef" class="profile-menu">
        <button
          class="profile-chip"
          type="button"
          :aria-expanded="profileMenuOpen"
          aria-haspopup="menu"
          @click="toggleProfileMenu"
        >
          <img :src="user.avatar" :alt="user.name" />
          <span>{{ user.name }}</span>
          <span class="material-symbols-outlined profile-chip-icon">expand_more</span>
        </button>

        <div v-if="profileMenuOpen" class="profile-dropdown" role="menu" aria-label="Меню профиля">
          <button type="button" class="profile-dropdown-item" role="menuitem" @click="openProfilePage">
            <span class="material-symbols-outlined">person</span>
            <span>Профиль</span>
          </button>

          <button type="button" class="profile-dropdown-item profile-dropdown-item-danger" role="menuitem" @click="logout">
            <span class="material-symbols-outlined">logout</span>
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <div
    v-if="mobileNavOpen"
    class="mobile-nav-backdrop"
    aria-hidden="true"
    @click="closeMobileNav"
  ></div>

  <aside
    class="mobile-nav-drawer"
    :class="{ open: mobileNavOpen }"
    aria-label="Мобильная навигация"
  >
    <div class="mobile-nav-header">
      <div>
        <strong>Навигация</strong>
        <p>{{ user.name }}</p>
      </div>

      <button type="button" class="mobile-menu-btn mobile-menu-btn-inside" aria-label="Закрыть меню" @click="closeMobileNav">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <nav class="mobile-nav-links" aria-label="Навигация по разделам">
      <RouterLink
        v-for="item in normalizedItems"
        :key="item.label"
        :to="item.to"
        class="mobile-nav-link"
        :class="{ active: item.active }"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <RouterLink to="/create-group" class="create-group-btn mobile-create-group-btn">
      Создать группу
    </RouterLink>

    <div class="mobile-nav-actions">
      <button
        class="theme-toggle-btn mobile-action-btn"
        type="button"
        :aria-label="themeLabel"
        :title="themeLabel"
        @click="emit('toggleTheme')"
      >
        <span class="material-symbols-outlined">{{ themeIcon }}</span>
        <span>{{ themeLabel }}</span>
      </button>

      <button class="notification-btn mobile-action-btn" type="button" aria-label="Уведомления">
        <span class="material-symbols-outlined">notifications</span>
        <span>Уведомления</span>
        <span class="notification-badge">3</span>
      </button>

      <button class="profile-chip mobile-action-btn mobile-profile-btn" type="button" @click="openProfilePage">
        <img :src="user.avatar" :alt="user.name" />
        <span>{{ user.name }}</span>
      </button>
    </div>
  </aside>
</template>
