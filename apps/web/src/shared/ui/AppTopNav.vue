<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useNotificationStore } from '@/shared/notifications/stores/notifications.store'
import AppButton from './AppButton.vue'

const navItems = [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Мои группы', to: '/my-groups' },
  { label: 'Чаты', to: '/chats' }
]

const auth = useAuthStore()
const notifications = useNotificationStore()
const isProfileMenuOpen = ref(false)
const userInitial = computed(() => auth.user?.displayName.slice(0, 1).toUpperCase() ?? '')

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

async function logout() {
  isProfileMenuOpen.value = false
  try {
    await auth.logout()
    notifications.success('Вы вышли из аккаунта')
  } catch {
    notifications.error('Не удалось завершить сессию')
  }
}
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
        <div v-if="auth.isAuthenticated && auth.user" class="top-nav__user top-nav__profile">
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
  background: rgb(251 248 255 / 86%);
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 40px rgb(27 27 32 / 4%);
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
  border-left: 1px solid rgb(199 197 211 / 22%);
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

.top-nav__auth-actions {
  align-items: center;
  border-left: 1px solid rgb(199 197 211 / 22%);
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
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(18px);
  border-radius: var(--radius-md);
  box-shadow: 0 24px 60px -34px rgb(21 25 108 / 45%);
  display: grid;
  gap: 4px;
  min-width: 180px;
  padding: 8px;
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
  min-height: 38px;
  padding: 0 12px;
  text-align: left;
}

.top-nav__profile-menu a:hover,
.top-nav__profile-menu button:hover {
  background: var(--color-surface-low);
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
  border-top: 1px solid rgb(199 197 211 / 32%);
  color: var(--color-error);
  margin-top: 4px;
  padding-top: 8px;
}

.top-nav__profile-menu .top-nav__profile-menu-logout:hover {
  background: rgb(255 244 242 / 82%);
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
