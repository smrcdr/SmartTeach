<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { appName } from '../app/config/brand'
import logo from '../assets/smarteach-logo-light.png'
import AppButton from '../shared/ui/AppButton.vue'
import AppContainer from '../shared/ui/AppContainer.vue'

const route = useRoute()
const router = useRouter()
const contentSize = computed(() => (route.name === 'landing' ? 'full' : 'wide'))
const isAuthRoute = computed(() => route.name === 'login' || route.name === 'register')
const mobileMenuOpen = ref(false)
const searchQuery = ref('')

const primaryNav = computed(() => [
  {
    label: 'Главная',
    to: { path: '/groups' },
    active: route.name === 'groups',
  },
  {
    label: 'Мои группы',
    to: { path: '/my-groups' },
    active: route.name === 'my-groups',
  },
  {
    label: 'Каталог',
    to: { path: '/catalog' },
    active: route.name === 'catalog',
  },
  {
    label: 'Чаты',
    to: { path: '/chats' },
    active: route.path.startsWith('/chats'),
  },
])

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

async function submitSearch() {
  const normalizedQuery = searchQuery.value.trim()

  await router.push({
    path: '/catalog',
    query: normalizedQuery ? { q: normalizedQuery } : {},
  })
}
</script>

<template>
  <div class="public-layout">
    <header class="public-layout__header">
      <div class="topbar">
        <div class="topbar-start">
          <div class="public-layout__mobile-toggle-row">
            <button
              type="button"
              class="public-layout__menu-button"
              aria-label="Открыть навигацию"
              @click="mobileMenuOpen = true"
            >
              <span class="material-symbols-outlined">menu</span>
            </button>

            <RouterLink to="/groups" class="brand">
              <img class="brand-logo" :src="logo" :alt="appName" />
              <div class="brand-copy">
                <strong>{{ appName }}</strong>
              </div>
            </RouterLink>
          </div>

          <nav class="topbar-nav public-layout__desktop-nav" aria-label="Основная навигация">
            <RouterLink
              v-for="item in primaryNav"
              :key="item.label"
              :to="item.to"
              class="nav-link"
              :class="{ active: item.active }"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="topbar-tools public-layout__desktop-tools">
          <label class="search-field" aria-label="Поиск по группам">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск групп..."
              @keydown.enter.prevent="submitSearch"
            />
          </label>
          <div class="public-layout__auth-links">
            <RouterLink
              to="/login"
              class="nav-link public-layout__auth-link"
              :class="{ active: route.name === 'login' }"
            >
              Войти
            </RouterLink>
            <span class="public-layout__auth-separator">/</span>
            <RouterLink
              to="/register"
              class="nav-link public-layout__auth-link"
              :class="{ active: route.name === 'register' }"
            >
              Регистрация
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main :class="['public-layout__main', { 'public-layout__main--auth': isAuthRoute }]">
      <AppContainer :class="{ 'public-layout__content--auth': isAuthRoute }" :size="contentSize">
        <RouterView />
      </AppContainer>
    </main>

    <transition name="public-fade">
      <div v-if="mobileMenuOpen" class="public-layout__overlay">
        <button
          type="button"
          class="public-layout__backdrop"
          aria-label="Закрыть навигацию"
          @click="mobileMenuOpen = false"
        />

        <div class="public-layout__drawer">
          <div class="public-layout__drawer-header">
            <div>
              <span class="page-eyebrow">Навигация</span>
              <h2 class="section-title">Разделы SmartTeach</h2>
            </div>

            <button type="button" class="public-layout__drawer-close" @click="mobileMenuOpen = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav class="public-layout__drawer-nav" aria-label="Мобильная навигация">
            <RouterLink
              v-for="item in primaryNav"
              :key="item.label"
              :to="item.to"
              class="public-layout__drawer-link"
              :class="{ 'public-layout__drawer-link--active': item.active }"
            >
              {{ item.label }}
            </RouterLink>
          </nav>

          <label class="search-field" aria-label="Поиск по группам">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск групп..."
              @keydown.enter.prevent="submitSearch"
            />
          </label>

          <div class="public-layout__drawer-actions">
            <RouterLink to="/login" class="public-layout__drawer-link" @click="mobileMenuOpen = false">
              Войти
            </RouterLink>
            <AppButton to="/register" block>Регистрация</AppButton>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.public-layout__header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding-top: 8px;
  background: var(--color-bg);
}

.public-layout__main {
  padding-bottom: 24px;
}

.public-layout__main--auth {
  display: flex;
  align-items: center;
  min-height: calc(100vh - 110px);
  padding: 32px 0 40px;
}

.public-layout__content--auth {
  display: flex;
  align-items: center;
  justify-content: center;
}

.public-layout__auth-links {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.public-layout__auth-separator {
  color: #8ba0b7;
  font-weight: 700;
  user-select: none;
  -webkit-user-select: none;
}

.public-layout__auth-link.active::after {
  display: none;
}

.public-layout__mobile-toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.public-layout__menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #f5f9fc;
  border: 1px solid #c2cfdb;
  color: #60758d;
}

.public-layout__overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.public-layout__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(12, 24, 39, 0.28);
}

.public-layout__drawer {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  gap: 14px;
  width: min(360px, 92vw);
  height: 100%;
  padding: 18px;
  background: #ffffff;
  border-left: 1px solid #bcc9d6;
}

.public-layout__drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.public-layout__drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f5f9fc;
  border: 1px solid #c2cfdb;
  color: #60758d;
}

.public-layout__drawer-nav,
.public-layout__drawer-actions {
  display: grid;
  gap: 10px;
}

.public-layout__drawer-link {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f9fbfd;
  border: 1px solid #c6d3df;
  font-weight: 700;
}

.public-layout__drawer-link--active {
  background: #dff0fb;
  border-color: #9fd2ec;
}

.public-fade-enter-active,
.public-fade-leave-active {
  transition: opacity 180ms ease;
}

.public-fade-enter-from,
.public-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1080px) {
  .public-layout__main--auth {
    min-height: auto;
    padding-top: 24px;
  }

  .public-layout__menu-button {
    display: inline-flex;
  }

  .public-layout__desktop-nav,
  .public-layout__desktop-tools {
    display: none;
  }
}
</style>
