<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import { useTheme } from '@/shared/theme/theme'
import AppButton from './AppButton.vue'

const navItems = [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Мои группы', to: '/my-groups' },
  { label: 'Чаты', to: '/chats' }
]

const auth = useAuthStore()
const notifications = useNotificationStore()
const route = useRoute()
const router = useRouter()
const isProfileMenuOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const { theme, toggleTheme } = useTheme()
const userInitial = computed(() => auth.user?.displayName.slice(0, 1).toUpperCase() ?? '')
const isDarkTheme = computed(() => theme.value === 'dark')
const themeToggleAriaLabel = computed(() => theme.value === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему')

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

function closeProfileMenuOnOutsidePointerDown(event: Event) {
  const target = event.target

  if (!isProfileMenuOpen.value || !(target instanceof Node)) {
    return
  }

  if (profileRef.value?.contains(target)) {
    return
  }

  isProfileMenuOpen.value = false
}

async function redirectToLogin() {
  if (route.name === 'login') {
    return
  }

  if (route.meta.requiresAuth) {
    await router.push({
      name: 'login',
      query: { redirect: route.fullPath }
    })
    return
  }

  await router.push({ name: 'login' })
}

async function logout() {
  isProfileMenuOpen.value = false
  try {
    await auth.logout()
    notifications.success('Вы вышли из аккаунта')
  } catch {
    notifications.error('Не удалось завершить сессию')
  } finally {
    await redirectToLogin()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeProfileMenuOnOutsidePointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeProfileMenuOnOutsidePointerDown)
})
</script>

<template>
  <header class="top-nav">
    <div class="top-nav__inner top-nav__inner--full">
      <div class="top-nav__primary">
        <RouterLink to="/" class="top-nav__brand">SmarTeach</RouterLink>
        <nav class="top-nav__links" aria-label="Основная навигация">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            active-class=""
            class="top-nav__link"
            exact-active-class="top-nav__link--active"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>

      <div class="top-nav__actions">
        <button
          :class="['top-nav__theme-switch', { 'top-nav__theme-switch--dark': isDarkTheme }]"
          type="button"
          role="switch"
          :aria-checked="isDarkTheme"
          :aria-label="themeToggleAriaLabel"
          @click="toggleTheme"
        >
          <span class="top-nav__theme-switch-track" aria-hidden="true">
            <span class="top-nav__theme-switch-thumb"></span>
            <span class="material-symbols-outlined top-nav__theme-switch-icon top-nav__theme-switch-icon--sun">
              light_mode
            </span>
            <span class="material-symbols-outlined top-nav__theme-switch-icon top-nav__theme-switch-icon--moon">
              dark_mode
            </span>
          </span>
        </button>
        <div v-if="auth.isAuthenticated && auth.user" ref="profileRef" class="top-nav__user top-nav__profile">
          <button
            class="top-nav__profile-trigger"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="isProfileMenuOpen"
            @click="toggleProfileMenu"
          >
            <span>{{ auth.user.displayName }}</span>
            <img
              v-if="auth.user.avatarUrl"
              :src="auth.user.avatarUrl"
              :alt="auth.user.displayName"
            />
            <span v-else class="top-nav__profile-initials" aria-hidden="true">{{ userInitial }}</span>
          </button>
          <div v-if="isProfileMenuOpen" class="top-nav__profile-menu" role="menu">
            <RouterLink to="/profile" role="menuitem" @click="isProfileMenuOpen = false">
              <span class="material-symbols-outlined top-nav__menu-icon" aria-hidden="true">person</span>
              Открыть профиль
            </RouterLink>
            <RouterLink to="/profile/edit" role="menuitem" @click="isProfileMenuOpen = false">
              <span class="material-symbols-outlined top-nav__menu-icon" aria-hidden="true">edit</span>
              Редактировать профиль
            </RouterLink>
            <button class="top-nav__profile-menu-logout" type="button" role="menuitem" @click="logout">
              <span
                id="logout"
                class="material-symbols-outlined top-nav__menu-icon"
                data-icon-id="logout"
                aria-hidden="true"
              >logout</span>
              Выйти
            </button>
          </div>
        </div>
        <div v-else class="top-nav__auth-actions">
          <RouterLink to="/login">Войти</RouterLink>
          <RouterLink to="/register" class="top-nav__register">Регистрация</RouterLink>
        </div>
        <AppButton variant="quiet" icon-only aria-label="Открыть меню" class="top-nav__menu">
          <Menu :size="19" />
        </AppButton>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-nav {
  background: var(--color-nav-surface);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--color-nav-border);
  box-shadow: var(--shadow-nav);
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 30;
}

.top-nav__inner {
  align-items: center;
  display: flex;
  height: 64px;
  justify-content: space-between;
  padding: 0 var(--space-page-x);
  width: 100%;
}

.top-nav__inner--full {
  max-width: none;
}

.top-nav__primary,
.top-nav__actions,
.top-nav__user {
  align-items: center;
  display: flex;
}

.top-nav__primary {
  gap: 34px;
  justify-content: flex-start;
  min-width: 0;
}

.top-nav__brand {
  color: var(--color-primary);
  font-size: 1.22rem;
  font-weight: 850;
  letter-spacing: 0;
}

.top-nav__links {
  align-items: center;
  display: flex;
  gap: 30px;
}

.top-nav__link {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 650;
  padding: 23px 0 18px;
  position: relative;
}

.top-nav__link:hover,
.top-nav__link--active {
  color: var(--color-primary);
}

.top-nav__link--active::after {
  background: var(--color-primary);
  border-radius: 999px;
  bottom: 12px;
  content: '';
  height: 2px;
  left: 0;
  position: absolute;
  right: 0;
}

.top-nav__actions {
  gap: 16px;
}

.top-nav__user,
.top-nav__auth-actions {
  gap: 12px;
}

.top-nav__user {
  position: relative;
}

.top-nav__profile-trigger {
  align-items: center;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--color-divider);
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 0 0 0 18px;
}

.top-nav__profile-trigger span,
.top-nav__auth-actions a,
.top-nav__profile-menu a,
.top-nav__profile-menu button {
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 650;
}

.top-nav__theme-switch {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  padding: 2px;
}

.top-nav__theme-switch-track {
  align-items: center;
  background: var(--color-surface-high);
  border: 1px solid var(--color-divider);
  border-radius: 999px;
  box-shadow: inset 0 1px 3px rgb(27 27 32 / 10%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 36px;
  justify-items: center;
  position: relative;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  width: 68px;
}

.top-nav__theme-switch:hover .top-nav__theme-switch-track {
  border-color: var(--color-primary);
}

.top-nav__theme-switch:focus-visible {
  outline: none;
}

.top-nav__theme-switch:focus-visible .top-nav__theme-switch-track {
  box-shadow: 0 0 0 4px var(--color-focus-ring), inset 0 1px 3px rgb(27 27 32 / 10%);
}

.top-nav__theme-switch-thumb {
  background: var(--color-surface-lowest);
  border-radius: 999px;
  box-shadow: 0 5px 14px rgb(27 27 32 / 18%);
  height: 30px;
  left: 3px;
  position: absolute;
  top: 3px;
  transform: translateX(0);
  transition: transform 0.2s ease, background-color 0.18s ease, box-shadow 0.18s ease;
  width: 30px;
  z-index: 1;
}

.top-nav__theme-switch-icon {
  color: var(--color-text-muted);
  font-family: 'Material Symbols Outlined';
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
  position: relative;
  transition: color 0.18s ease;
  z-index: 2;
}

.top-nav__theme-switch-icon--sun {
  color: #936200;
}

.top-nav__theme-switch--dark .top-nav__theme-switch-track {
  background: var(--color-primary-fixed);
  border-color: var(--color-primary-container);
}

.top-nav__theme-switch--dark .top-nav__theme-switch-thumb {
  box-shadow: 0 6px 16px rgb(0 0 0 / 36%);
  transform: translateX(32px);
}

.top-nav__theme-switch--dark .top-nav__theme-switch-icon--sun {
  color: var(--color-text-muted);
}

.top-nav__theme-switch--dark .top-nav__theme-switch-icon--moon {
  color: var(--color-primary);
}

.top-nav__auth-actions {
  align-items: center;
  border-left: 1px solid var(--color-divider);
  display: flex;
  padding-left: 18px;
}

.top-nav__register {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  border-radius: var(--radius-sm);
  color: #fff !important;
  min-height: 36px;
  padding: 10px 14px;
}

.top-nav__profile-menu {
  background: var(--color-menu-surface);
  backdrop-filter: blur(18px);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 4px;
  min-width: 236px;
  padding: 10px;
  position: absolute;
  right: 0;
  top: calc(100% + 12px);
}

.top-nav__profile-menu a,
.top-nav__profile-menu button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  text-align: left;
}

.top-nav__profile-menu a:hover,
.top-nav__profile-menu button:hover {
  background: var(--color-menu-hover);
  color: var(--color-primary);
}

.top-nav__menu-icon {
  font-family: 'Material Symbols Outlined';
  font-size: 19px;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
}

.top-nav__profile-menu .top-nav__profile-menu-logout {
  border-top: 1px solid var(--color-divider);
  color: var(--color-error);
  margin-top: 4px;
  padding-top: 8px;
}

.top-nav__profile-menu .top-nav__profile-menu-logout:hover {
  background: var(--color-danger-surface);
  color: var(--color-error);
}

.top-nav__profile-trigger img,
.top-nav__profile-initials {
  border-radius: 999px;
  height: 40px;
  width: 40px;
}

.top-nav__profile-trigger img {
  object-fit: cover;
}

.top-nav__profile-initials {
  align-items: center;
  background: var(--color-primary);
  color: #fff !important;
  display: inline-flex;
  font-size: 0.92rem !important;
  font-weight: 850 !important;
  justify-content: center;
}

.top-nav__menu {
  display: none;
}

@media (max-width: 860px) {
  .top-nav__links,
  .top-nav__user,
  .top-nav__auth-actions {
    display: none;
  }

  .top-nav__menu {
    display: inline-flex;
  }
}
</style>
