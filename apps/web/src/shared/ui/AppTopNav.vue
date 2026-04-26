<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import AppButton from './AppButton.vue'

const navItems = [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Мои группы', to: '/my-groups' },
  { label: 'Чаты', to: '/chats' }
]

const auth = useAuthStore()
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
            class="top-nav__link"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>

      <div class="top-nav__actions">
        <div class="top-nav__user top-nav__profile">
          <span>{{ auth.displayUser.name }}</span>
          <img :src="auth.displayUser.avatarUrl || ''" :alt="auth.displayUser.name" />
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
.top-nav__link.router-link-active {
  color: var(--color-primary);
}

.top-nav__link.router-link-active::after {
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

.top-nav__user {
  border-left: 1px solid rgb(199 197 211 / 22%);
  gap: 12px;
  padding-left: 18px;
}

.top-nav__user span {
  color: var(--color-text);
  font-size: 0.86rem;
  font-weight: 650;
}

.top-nav__user img {
  border-radius: 999px;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.top-nav__menu {
  display: none;
}

@media (max-width: 860px) {
  .top-nav__links,
  .top-nav__user {
    display: none;
  }

  .top-nav__menu {
    display: inline-flex;
  }
}
</style>
