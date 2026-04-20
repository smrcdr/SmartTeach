<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getGroupsErrorMessage } from '../features/groups/api/groups.api'
import { useGroupWorkspace } from '../features/groups/composables/useGroupWorkspace'
import AppButton from '../shared/ui/AppButton.vue'
import AppCard from '../shared/ui/AppCard.vue'
import AppErrorState from '../shared/ui/AppErrorState.vue'
import AppLoader from '../shared/ui/AppLoader.vue'

const route = useRoute()
const mobileSectionsOpen = ref(false)

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const group = computed(() => workspace.group.value)
const settings = computed(() => workspace.settings.value)
const errorMessage = computed(() => {
  const error = workspace.workspaceError.value

  return error ? getGroupsErrorMessage(error, 'Не удалось загрузить рабочее пространство группы') : ''
})
const activeWorkspaceModule = computed(() => {
  const matchedRecord = [...route.matched]
    .reverse()
    .find((record) => typeof record.meta.workspaceModule === 'string')

  return typeof matchedRecord?.meta.workspaceModule === 'string' ? matchedRecord.meta.workspaceModule : ''
})

watch(
  () => route.fullPath,
  () => {
    mobileSectionsOpen.value = false
  },
)

function isActive(routeName: string, module: string) {
  return route.matched.some((record) => record.name === routeName) || activeWorkspaceModule.value === module
}

function getNavIcon(module: string) {
  switch (module) {
    case 'overview':
      return 'dashboard'
    case 'lessons':
      return 'menu_book'
    case 'assignments':
      return 'assignment'
    case 'schedule':
      return 'calendar_month'
    case 'chats':
      return 'chat'
    case 'members':
      return 'group'
    case 'requests':
      return 'inbox'
    case 'settings':
      return 'settings'
    default:
      return 'circle'
  }
}
</script>

<template>
  <div class="workspace">
    <AppLoader v-if="workspace.isWorkspacePending.value" label="Собираем рабочее пространство группы и права доступа" />

    <AppErrorState
      v-else-if="errorMessage"
      title="Не удалось открыть рабочее пространство группы"
      :description="errorMessage"
    >
      <template #actions>
        <AppButton to="/groups" variant="secondary">К списку групп</AppButton>
      </template>
    </AppErrorState>

    <template v-else-if="group && settings">
      <div class="workspace__layout">
        <aside class="workspace__sidebar">
          <AppButton variant="ghost" class="workspace__menu-button" @click="mobileSectionsOpen = true">
            Разделы группы
          </AppButton>

          <nav class="workspace__nav" aria-label="Разделы группы">
            <RouterLink
              v-for="item in workspace.visibleNavItems.value"
              :key="item.key"
              :to="item.to"
              :class="['workspace__nav-link', { 'workspace__nav-link--active': isActive(item.routeName, item.module) }]"
            >
              <span class="material-symbols-outlined workspace__nav-icon">{{ getNavIcon(item.module) }}</span>
              <strong>{{ item.label }}</strong>
            </RouterLink>
          </nav>
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
              <div>
                <span class="page-eyebrow">Разделы группы</span>
                <h2 class="workspace__drawer-title">{{ group.name }}</h2>
              </div>

              <button type="button" class="workspace__drawer-close" @click="mobileSectionsOpen = false">
                Закрыть
              </button>
            </div>

            <nav class="workspace__drawer-nav" aria-label="Разделы группы">
              <RouterLink
                v-for="item in workspace.visibleNavItems.value"
                :key="item.key"
                :to="item.to"
              :class="[
                  'workspace__drawer-link',
                  { 'workspace__drawer-link--active': isActive(item.routeName, item.module) },
                ]"
              >
                <span class="material-symbols-outlined workspace__drawer-icon">{{ getNavIcon(item.module) }}</span>
                <strong>{{ item.label }}</strong>
              </RouterLink>
            </nav>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: 1rem;
  padding: 0 12px;
}

.workspace__menu-button {
  display: none;
}

.workspace__layout {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  min-height: calc(100vh - 5.75rem);
}

.workspace__sidebar {
  position: sticky;
  top: 6.25rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-self: stretch;
  padding-top: 0.25rem;
  padding-right: 1rem;
  border-right: 1px solid var(--color-border);
}

.workspace__nav {
  display: grid;
  gap: 0.2rem;
  background: transparent;
  width: 100%;
}

.workspace__nav-link {
  display: grid;
  grid-template-columns: 1.125rem minmax(0, 1fr);
  align-items: center;
  gap: 0.65rem;
  min-height: 2.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  color: var(--color-subtle);
  font-size: 0.95rem;
  font-weight: 600;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.workspace__nav-link:hover {
  background: rgba(var(--color-accent-rgb), 0.05);
}

.workspace__nav-link strong {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.workspace__nav-icon {
  font-size: 1.05rem;
  color: #4f667d;
}

.workspace__nav-link--active {
  background: #e8f4fb;
}

.workspace__nav-link--active strong,
.workspace__nav-link--active .workspace__nav-icon {
  color: #2a6d8f;
}

.workspace__content {
  min-width: 0;
  padding-left: 0.25rem;
  align-self: stretch;
}

.workspace__content :deep(.app-card) {
  border: none;
  box-shadow: none;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.workspace__drawer-title {
  font-size: 1.4rem;
  letter-spacing: -0.03em;
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
  display: grid;
  grid-template-columns: 1.1rem minmax(0, 1fr);
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-sm) - 2px);
  background: var(--color-panel-muted);
}

.workspace__drawer-icon {
  font-size: 1rem;
  color: var(--color-subtle);
}

.workspace__drawer-link--active {
  border-color: rgba(var(--color-accent-rgb), 0.16);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.workspace__drawer-link--active .workspace__drawer-icon {
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

  .workspace__nav {
    display: none;
  }

  .workspace__layout {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .workspace__sidebar {
    position: static;
    display: block;
    border-right: none;
    padding-right: 0;
  }
}
</style>
