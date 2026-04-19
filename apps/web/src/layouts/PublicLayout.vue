<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

import { appDescription, appName } from '../app/config/brand'
import logo from '../assets/smarteach-logo-blue.png'
import AppButton from '../shared/ui/AppButton.vue'
import AppContainer from '../shared/ui/AppContainer.vue'

const route = useRoute()

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="public-layout">
    <header class="public-layout__header">
      <AppContainer size="full">
        <div class="public-layout__header-row">
          <RouterLink to="/" class="brand">
            <img :src="logo" :alt="appName" class="brand__mark" />
            <div class="brand__copy">
              <strong>{{ appName }}</strong>
              <span>{{ appDescription }}</span>
            </div>
          </RouterLink>

          <nav class="public-layout__nav" aria-label="Публичная навигация">
            <RouterLink
              to="/login"
              :class="['public-layout__link', { 'public-layout__link--active': isActive('/login') }]"
            >
              Войти
            </RouterLink>
            <AppButton to="/register" variant="secondary" size="sm">Регистрация</AppButton>
          </nav>
        </div>
      </AppContainer>
    </header>

    <main class="public-layout__main">
      <AppContainer size="wide">
        <RouterView />
      </AppContainer>
    </main>
  </div>
</template>

<style scoped>
.public-layout {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr;
}

.public-layout__header {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 1rem 0 0;
}

.public-layout__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-sm);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.brand__mark {
  width: 2.8rem;
  height: 2.8rem;
  object-fit: contain;
}

.brand__copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.brand__copy strong {
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.brand__copy span {
  color: var(--color-subtle);
  font-size: 0.92rem;
}

.public-layout__nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.public-layout__link {
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-pill);
  color: var(--color-subtle);
  font-weight: 700;
}

.public-layout__link--active {
  background: var(--color-panel);
  color: var(--color-text);
}

.public-layout__main {
  padding: 2rem 0 2.5rem;
}

@media (max-width: 900px) {
  .public-layout__header-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .public-layout__nav {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .brand__copy span {
    display: none;
  }
}
</style>
