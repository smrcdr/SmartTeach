<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { groupWorkspaceNav } from '../features/groups/config/group-workspace-nav'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'

const route = useRoute()
const mobileSectionsOpen = ref(false)

const groupId = computed(() => String(route.params.groupId ?? 'group'))
const workspaceName = computed(() => groupId.value.toUpperCase())
const workspaceLinks = computed(() =>
  groupWorkspaceNav.map((item) => ({
    ...item,
    to: `/groups/${groupId.value}/${item.key}`,
  })),
)

watch(
  () => route.fullPath,
  () => {
    mobileSectionsOpen.value = false
  },
)

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="workspace">
    <div class="workspace__hero">
      <div class="page-header">
        <span class="page-eyebrow">Group Workspace</span>
        <h1 class="page-title">{{ workspaceName }}</h1>
        <p class="page-lead">
          Layout уже отделяет локальную навигацию группы от глобального app shell. Данные и role-based visibility
          подключатся на следующих шагах.
        </p>
      </div>

      <AppButton variant="ghost" class="workspace__menu-button" @click="mobileSectionsOpen = true">
        Разделы группы
      </AppButton>
    </div>

    <div class="workspace__layout">
      <aside class="workspace__sidebar">
        <nav class="workspace__nav" aria-label="Разделы группы">
          <RouterLink
            v-for="item in workspaceLinks"
            :key="item.key"
            :to="item.to"
            :class="['workspace__nav-link', { 'workspace__nav-link--active': isActive(item.to) }]"
          >
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </RouterLink>
        </nav>

        <AppCard tone="accent">
          <h2 class="workspace__card-title">Контекст группы</h2>
          <p class="muted">
            Этот sidebar уже готов для module visibility, owner/admin actions и мобильного drawer без возврата к старым
            мок-компонентам.
          </p>
        </AppCard>
      </aside>

      <section class="workspace__content">
        <RouterView />
      </section>
    </div>

    <transition name="workspace-fade">
      <div v-if="mobileSectionsOpen" class="workspace__overlay">
        <button
          type="button"
          class="workspace__backdrop"
          aria-label="Закрыть навигацию группы"
          @click="mobileSectionsOpen = false"
        />

        <div class="workspace__drawer">
          <div class="workspace__drawer-header">
            <span class="page-eyebrow">Разделы группы</span>
            <button type="button" class="workspace__drawer-close" @click="mobileSectionsOpen = false">
              Закрыть
            </button>
          </div>

          <nav class="workspace__drawer-nav" aria-label="Разделы группы">
            <RouterLink
              v-for="item in workspaceLinks"
              :key="item.key"
              :to="item.to"
              :class="['workspace__drawer-link', { 'workspace__drawer-link--active': isActive(item.to) }]"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: 1.5rem;
}

.workspace__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.4rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.64);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.workspace__menu-button {
  display: none;
}

.workspace__layout {
  display: grid;
  grid-template-columns: minmax(16rem, 19rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.workspace__sidebar {
  position: sticky;
  top: 6.4rem;
  display: grid;
  gap: 1rem;
}

.workspace__nav {
  display: grid;
  gap: 0.5rem;
}

.workspace__nav-link {
  display: grid;
  gap: 0.25rem;
  padding: 0.95rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.58);
  color: var(--color-subtle);
}

.workspace__nav-link strong {
  color: var(--color-text);
}

.workspace__nav-link span {
  font-size: 0.9rem;
}

.workspace__nav-link--active {
  border-color: rgba(31, 117, 156, 0.18);
  background: var(--color-accent-soft);
}

.workspace__content {
  min-width: 0;
}

.workspace__card-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.workspace__overlay {
  position: fixed;
  inset: 0;
  z-index: 55;
}

.workspace__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 32, 51, 0.18);
  cursor: pointer;
}

.workspace__drawer {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  gap: 1rem;
  padding: 1.2rem 1rem 1rem;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  background: var(--color-panel);
  box-shadow: var(--shadow-md);
}

.workspace__drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.workspace__drawer-close {
  padding: 0;
  color: var(--color-subtle);
  cursor: pointer;
}

.workspace__drawer-nav {
  display: grid;
  gap: 0.45rem;
}

.workspace__drawer-link {
  padding: 0.85rem 0.95rem;
  border-radius: var(--radius-sm);
  background: var(--color-panel-muted);
  font-weight: 700;
}

.workspace__drawer-link--active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.workspace-fade-enter-active,
.workspace-fade-leave-active {
  transition: opacity 180ms ease;
}

.workspace-fade-enter-from,
.workspace-fade-leave-to {
  opacity: 0;
}

@media (max-width: 980px) {
  .workspace__menu-button {
    display: inline-flex;
  }

  .workspace__layout {
    grid-template-columns: 1fr;
  }

  .workspace__sidebar {
    display: none;
  }
}

@media (max-width: 760px) {
  .workspace__hero {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
