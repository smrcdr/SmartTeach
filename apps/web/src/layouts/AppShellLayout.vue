<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { appName } from '../app/config/brand'
import logo from '../assets/smarteach-logo-light.png'
import { getAuthErrorMessage } from '../features/auth/api/auth.api'
import { useAuth } from '../features/auth/composables/useAuth'
import { getUserInitials } from '../shared/lib/user-profile'
import AppButton from '../shared/ui/AppButton.vue'
import AppContainer from '../shared/ui/AppContainer.vue'
import AppErrorState from '../shared/ui/AppErrorState.vue'

const route = useRoute()
const router = useRouter()
const { currentUser, logout } = useAuth()
const mobileMenuOpen = ref(false)
const profileMenuOpen = ref(false)
const searchQuery = ref('')
const isLoggingOut = ref(false)
const logoutError = ref('')
const isAuthenticated = computed(() => Boolean(currentUser.value))
const isGroupWorkspaceRoute = computed(() => route.matched.some((record) => record.meta.requiresGroupMembership))

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

const accountName = computed(() => currentUser.value?.displayName ?? appName)
const accountInitials = computed(() => getUserInitials(accountName.value))

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
    profileMenuOpen.value = false
    logoutError.value = ''
  },
)

async function submitSearch() {
  const normalizedQuery = searchQuery.value.trim()

  await router.push({
    path: '/catalog',
    query: normalizedQuery ? { q: normalizedQuery } : {},
  })
}

async function handleLogout() {
  if (isLoggingOut.value) {
    return
  }

  isLoggingOut.value = true
  logoutError.value = ''

  try {
    await logout()
    await router.push({
      name: 'login',
    })
  } catch (error) {
    logoutError.value = getAuthErrorMessage(
      error,
      'Не удалось завершить сессию. Проверьте соединение и попробуйте снова.',
    )
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="shell-layout">
    <header class="shell-layout__header">
      <div class="topbar">
        <div class="topbar-start">
          <div class="shell-layout__mobile-toggle-row">
            <button
              type="button"
              class="shell-layout__menu-button"
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

          <nav class="topbar-nav shell-layout__desktop-nav" aria-label="Основная навигация">
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

        <div class="topbar-tools shell-layout__desktop-tools">
          <label class="search-field" aria-label="Поиск по группам">
            <span class="material-symbols-outlined search-icon">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск групп..."
              @keydown.enter.prevent="submitSearch"
            />
          </label>

          <button v-if="isAuthenticated" class="notification-btn" type="button" aria-label="Уведомления">
            <span class="material-symbols-outlined">notifications</span>
            <span class="notification-badge">3</span>
          </button>

          <div v-if="currentUser" class="shell-layout__profile-menu">
            <button
              class="profile-chip"
              type="button"
              :aria-expanded="profileMenuOpen"
              aria-haspopup="menu"
              @click="profileMenuOpen = !profileMenuOpen"
            >
              <img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" :alt="accountName" />
              <span v-else class="shell-layout__avatar-fallback">{{ accountInitials }}</span>
              <span>{{ accountName }}</span>
              <span class="material-symbols-outlined shell-layout__profile-caret">expand_more</span>
            </button>

            <div v-if="profileMenuOpen" class="shell-layout__profile-dropdown" role="menu">
              <RouterLink to="/profile" class="shell-layout__profile-action" role="menuitem">
                Открыть профиль
              </RouterLink>
              <button
                type="button"
                class="shell-layout__profile-action shell-layout__profile-action--danger"
                role="menuitem"
                :disabled="isLoggingOut"
                @click="handleLogout"
              >
                {{ isLoggingOut ? 'Выходим...' : 'Выйти' }}
              </button>
            </div>
          </div>

          <template v-else>
            <div class="shell-layout__auth-links">
              <RouterLink
                to="/login"
                class="nav-link shell-layout__auth-link"
                :class="{ active: route.name === 'login' }"
              >
                Войти
              </RouterLink>
              <span class="shell-layout__auth-separator">/</span>
              <RouterLink
                to="/register"
                class="nav-link shell-layout__auth-link"
                :class="{ active: route.name === 'register' }"
              >
                Регистрация
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </header>

    <main class="shell-layout__main">
      <AppContainer v-if="!isGroupWorkspaceRoute" size="full">
        <AppErrorState
          v-if="logoutError"
          class="shell-layout__logout-error"
          title="Не удалось завершить сессию"
          :description="logoutError"
        />

        <RouterView />
      </AppContainer>

      <div v-else class="shell-layout__workspace-main">
        <AppErrorState
          v-if="logoutError"
          class="shell-layout__logout-error shell-layout__logout-error--workspace"
          title="Не удалось завершить сессию"
          :description="logoutError"
        />

        <RouterView />
      </div>
    </main>

    <transition name="shell-fade">
      <div v-if="mobileMenuOpen" class="shell-layout__overlay">
        <button
          type="button"
          class="shell-layout__backdrop"
          aria-label="Закрыть навигацию"
          @click="mobileMenuOpen = false"
        />

        <div class="shell-layout__drawer">
          <div class="shell-layout__drawer-header">
            <div>
              <span class="page-eyebrow">Навигация</span>
              <h2 class="section-title">Разделы SmartTeach</h2>
            </div>

            <button type="button" class="shell-layout__drawer-close" @click="mobileMenuOpen = false">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav class="shell-layout__drawer-nav" aria-label="Мобильная навигация">
            <RouterLink
              v-for="item in primaryNav"
              :key="item.label"
              :to="item.to"
              class="shell-layout__drawer-link"
              :class="{ 'shell-layout__drawer-link--active': item.active }"
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

          <template v-if="isAuthenticated">
            <RouterLink to="/profile" class="shell-layout__drawer-link">Профиль</RouterLink>
            <AppButton variant="secondary" :disabled="isLoggingOut" @click="handleLogout">
              {{ isLoggingOut ? 'Выходим...' : 'Выйти' }}
            </AppButton>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="shell-layout__drawer-link"
              :class="{ 'shell-layout__drawer-link--active': route.name === 'login' }"
            >
              Войти
            </RouterLink>
            <AppButton to="/register" block>Регистрация</AppButton>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.shell-layout {
  min-height: 100vh;
}

.shell-layout__header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding-top: 8px;
  background: var(--color-bg);
}

.shell-layout__main {
  padding-bottom: 24px;
}

.shell-layout__workspace-main {
  display: grid;
  gap: 16px;
}

.shell-layout__logout-error {
  margin-bottom: 16px;
}

.shell-layout__logout-error--workspace {
  margin: 0 12px;
}

.shell-layout__mobile-toggle-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.shell-layout__auth-links {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.shell-layout__auth-separator {
  color: #8ba0b7;
  font-weight: 700;
  user-select: none;
  -webkit-user-select: none;
}

.shell-layout__auth-link.active::after {
  display: none;
}

.shell-layout__profile-menu {
  position: relative;
}

.shell-layout__profile-caret {
  font-size: 18px;
  color: #8ba0b7;
}

.shell-layout__profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
  display: grid;
  gap: 4px;
  min-width: 210px;
  padding: 8px;
  border: 1px solid #c6d3df;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
}

.shell-layout__profile-action {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  border-radius: 12px;
  color: #334155;
  font-weight: 700;
  text-align: left;
}

.shell-layout__profile-action:hover {
  background: #f5f9fc;
}

.shell-layout__profile-action--danger {
  color: #9c4747;
}

.shell-layout__menu-button {
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

.shell-layout__avatar-fallback {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dff0fb;
  color: #1d8fe0;
  font-size: 0.82rem;
  font-weight: 800;
}

.shell-layout__overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.shell-layout__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(12, 24, 39, 0.28);
}

.shell-layout__drawer {
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

.shell-layout__drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.shell-layout__drawer-close {
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

.shell-layout__drawer-nav {
  display: grid;
  gap: 10px;
}

.shell-layout__drawer-link {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f9fbfd;
  border: 1px solid #c6d3df;
  font-weight: 700;
}

.shell-layout__drawer-link--active {
  background: #dff0fb;
  border-color: #9fd2ec;
}

.shell-fade-enter-active,
.shell-fade-leave-active {
  transition: opacity 180ms ease;
}

.shell-fade-enter-from,
.shell-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1080px) {
  .shell-layout__menu-button {
    display: inline-flex;
  }

  .shell-layout__desktop-nav,
  .shell-layout__desktop-tools {
    display: none;
  }
}
</style>
