<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { appName } from '../app/config/brand'
import logo from '../assets/smarteach-logo-blue.png'
import AppButton from '../shared/ui/AppButton.vue'
import AppContainer from '../shared/ui/AppContainer.vue'

const route = useRoute()
const router = useRouter()
const mobileMenuOpen = ref(false)
const searchQuery = ref('')

const primaryNav = [
  {
    label: 'Группы',
    to: '/groups',
  },
  {
    label: 'Чаты',
    to: '/chats',
  },
  {
    label: 'Профиль',
    to: '/profile',
  },
]

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
  },
)

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function submitSearch() {
  router.push({
    name: 'groups',
    query: searchQuery.value ? { q: searchQuery.value } : {},
  })
}
</script>

<template>
  <div class="shell-layout">
    <header class="shell-layout__header">
      <AppContainer size="full">
        <div class="shell-layout__header-row">
          <div class="shell-layout__brand-row">
            <button
              type="button"
              class="shell-layout__menu-button"
              aria-label="Открыть навигацию"
              @click="mobileMenuOpen = true"
            >
              Меню
            </button>

            <RouterLink to="/groups" class="brand">
              <img :src="logo" :alt="appName" class="brand__mark" />
              <span class="brand__name">{{ appName }}</span>
            </RouterLink>

            <nav class="shell-layout__nav shell-layout__nav--desktop" aria-label="Основная навигация">
              <RouterLink
                v-for="item in primaryNav"
                :key="item.to"
                :to="item.to"
                :class="['shell-layout__link', { 'shell-layout__link--active': isActive(item.to) }]"
              >
                {{ item.label }}
              </RouterLink>
            </nav>
          </div>

          <div class="shell-layout__tools">
            <form class="shell-layout__search" @submit.prevent="submitSearch">
              <input v-model="searchQuery" type="search" placeholder="Поиск по группам" />
            </form>
            <AppButton to="/groups/create" variant="secondary" size="sm">Создать группу</AppButton>
          </div>
        </div>
      </AppContainer>
    </header>

    <main class="shell-layout__main">
      <AppContainer size="full">
        <RouterView />
      </AppContainer>
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
            <span class="page-eyebrow">Навигация</span>
            <button type="button" class="shell-layout__drawer-close" @click="mobileMenuOpen = false">
              Закрыть
            </button>
          </div>

          <nav class="shell-layout__drawer-nav" aria-label="Мобильная навигация">
            <RouterLink
              v-for="item in primaryNav"
              :key="item.to"
              :to="item.to"
              :class="['shell-layout__drawer-link', { 'shell-layout__drawer-link--active': isActive(item.to) }]"
            >
              {{ item.label }}
            </RouterLink>
          </nav>

          <AppButton to="/groups/create" block>Создать группу</AppButton>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.shell-layout {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}

.shell-layout__header {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 1rem 0 0;
}

.shell-layout__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.shell-layout__brand-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.shell-layout__menu-button {
  display: none;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  cursor: pointer;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.brand__mark {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
}

.brand__name {
  font-weight: 800;
  letter-spacing: -0.03em;
}

.shell-layout__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.shell-layout__link {
  padding: 0.55rem 0.8rem;
  border-radius: var(--radius-pill);
  color: var(--color-subtle);
  font-weight: 700;
}

.shell-layout__link--active {
  background: var(--color-panel);
  color: var(--color-text);
}

.shell-layout__tools {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.shell-layout__search {
  min-width: min(24rem, 42vw);
}

.shell-layout__search input {
  width: 100%;
  min-height: 2.6rem;
  padding: 0.68rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-panel);
  color: var(--color-text);
  outline: none;
}

.shell-layout__main {
  padding: 1.5rem 0 2rem;
}

.shell-layout__overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.shell-layout__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 32, 51, 0.18);
  cursor: pointer;
}

.shell-layout__drawer {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  gap: 1rem;
  width: min(22rem, 88vw);
  height: 100%;
  padding: 1.25rem;
  background: var(--color-panel);
  box-shadow: var(--shadow-md);
}

.shell-layout__drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.shell-layout__drawer-close {
  padding: 0;
  color: var(--color-subtle);
  cursor: pointer;
}

.shell-layout__drawer-nav {
  display: grid;
  gap: 0.35rem;
}

.shell-layout__drawer-link {
  padding: 0.85rem 0.95rem;
  border-radius: var(--radius-sm);
  background: var(--color-panel-muted);
  color: var(--color-text);
  font-weight: 700;
}

.shell-layout__drawer-link--active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.shell-fade-enter-active,
.shell-fade-leave-active {
  transition: opacity 180ms ease;
}

.shell-fade-enter-from,
.shell-fade-leave-to {
  opacity: 0;
}

@media (max-width: 980px) {
  .shell-layout__nav--desktop {
    display: none;
  }

  .shell-layout__menu-button {
    display: inline-flex;
  }

  .shell-layout__header-row {
    align-items: stretch;
    flex-direction: column;
  }

  .shell-layout__tools {
    width: 100%;
    flex-wrap: wrap;
  }

  .shell-layout__search {
    min-width: 0;
    flex: 1 1 14rem;
  }
}

@media (max-width: 640px) {
  .brand__name {
    display: none;
  }
}
</style>
