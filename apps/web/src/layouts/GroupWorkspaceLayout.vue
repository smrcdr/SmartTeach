<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import GroupModuleBadges from '../features/groups/components/GroupModuleBadges.vue'
import { getGroupsErrorMessage } from '../features/groups/api/groups.api'
import { useGroupWorkspace } from '../features/groups/composables/useGroupWorkspace'
import {
  getEnabledGroupModules,
  getGroupMembershipRoleLabel,
  groupAccessModeLabels,
  groupStatusLabels,
} from '../features/groups/lib/groups.ui'
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
const workspaceName = computed(() => group.value?.name ?? groupId.value.toUpperCase())
const workspaceLead = computed(
  () => normalizeOptionalText(group.value?.description) || 'Единый workspace собирает все внутренние разделы группы в одном контексте.',
)
const membershipLabel = computed(() => getGroupMembershipRoleLabel(workspace.membershipRole.value))
const accessModeLabel = computed(() => (group.value ? groupAccessModeLabels[group.value.accessMode] : ''))
const statusLabel = computed(() => (group.value ? groupStatusLabels[group.value.status] : ''))
const moduleLabels = computed(() => (settings.value ? getEnabledGroupModules(settings.value) : []))
const readOnlyNotice = computed(() =>
  workspace.isReadOnly.value
    ? 'Группа находится в архиве. Внутренние разделы доступны только для просмотра, а редактирующие действия должны быть скрыты.'
    : 'Навигация и доступ к разделам собираются централизованно из membership, access mode и включённых модулей.',
)
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

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}
</script>

<template>
  <div class="workspace">
    <AppLoader v-if="workspace.isWorkspacePending.value" label="Собираем workspace группы и права доступа" />

    <AppErrorState
      v-else-if="errorMessage"
      title="Не удалось открыть workspace группы"
      :description="errorMessage"
    >
      <template #actions>
        <AppButton to="/groups" variant="secondary">К списку групп</AppButton>
      </template>
    </AppErrorState>

    <template v-else-if="group && settings">
      <div class="workspace__hero">
        <div class="workspace__hero-copy">
          <span class="page-eyebrow">Group Workspace</span>
          <h1 class="page-title">{{ workspaceName }}</h1>
          <p class="page-lead">{{ workspaceLead }}</p>

          <div class="pill-list">
            <span class="pill">{{ membershipLabel }}</span>
            <span class="pill">{{ accessModeLabel }}</span>
            <span class="pill">{{ statusLabel }}</span>
          </div>
        </div>

        <div class="workspace__hero-actions">
          <AppButton variant="ghost" class="workspace__menu-button" @click="mobileSectionsOpen = true">
            Разделы группы
          </AppButton>

          <AppCard tone="accent" class="workspace__notice">
            <strong>{{ workspace.isReadOnly.value ? 'Read-only режим' : 'Навигация группы' }}</strong>
            <p class="muted">{{ readOnlyNotice }}</p>
          </AppCard>
        </div>
      </div>

      <div class="workspace__layout">
        <aside class="workspace__sidebar">
          <nav class="workspace__nav" aria-label="Разделы группы">
            <RouterLink
              v-for="item in workspace.visibleNavItems.value"
              :key="item.key"
              :to="item.to"
              :class="['workspace__nav-link', { 'workspace__nav-link--active': isActive(item.routeName, item.module) }]"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.description }}</span>
            </RouterLink>
          </nav>

          <AppCard class="workspace__summary-card">
            <div class="workspace__summary-head">
              <h2 class="workspace__card-title">Сводка группы</h2>
              <span class="workspace__code">{{ group.code }}</span>
            </div>

            <div class="metric-grid">
              <div class="metric">
                <span class="metric__value">{{ group.membersCount }}</span>
                <span class="metric__label">Участники</span>
              </div>

              <div class="metric">
                <span class="metric__value">{{ moduleLabels.length }}</span>
                <span class="metric__label">Модули</span>
              </div>

              <div class="metric">
                <span class="metric__value">{{ workspace.primaryNavItems.value.length }}</span>
                <span class="metric__label">Разделы</span>
              </div>
            </div>

            <GroupModuleBadges :modules="moduleLabels" />
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
              <div>
                <span class="page-eyebrow">Разделы группы</span>
                <h2 class="workspace__drawer-title">{{ workspaceName }}</h2>
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
                <strong>{{ item.label }}</strong>
                <span>{{ item.description }}</span>
              </RouterLink>
            </nav>

            <AppCard tone="muted">
              <div class="workspace__summary-head">
                <strong>Код группы</strong>
                <span class="workspace__code">{{ group.code }}</span>
              </div>
              <GroupModuleBadges :modules="moduleLabels" />
            </AppCard>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  gap: 1.5rem;
}

.workspace__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
  gap: 1rem;
  padding: 1.4rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.workspace__hero-copy {
  display: grid;
  gap: 0.9rem;
  min-width: 0;
}

.workspace__hero-actions {
  display: grid;
  gap: 0.75rem;
  align-content: start;
}

.workspace__notice {
  gap: 0.6rem;
}

.workspace__menu-button {
  display: none;
}

.workspace__layout {
  display: grid;
  grid-template-columns: minmax(17rem, 20rem) minmax(0, 1fr);
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

.workspace__summary-card {
  gap: 1.2rem;
}

.workspace__summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.workspace__card-title {
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.workspace__code {
  display: inline-flex;
  align-items: center;
  padding: 0.38rem 0.68rem;
  border-radius: var(--radius-pill);
  background: var(--color-panel-muted);
  color: var(--color-accent-strong);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.workspace__content {
  min-width: 0;
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
  gap: 0.2rem;
  padding: 0.85rem 0.95rem;
  border-radius: var(--radius-sm);
  background: var(--color-panel-muted);
}

.workspace__drawer-link span {
  color: var(--color-subtle);
  font-size: 0.88rem;
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
  .workspace__hero {
    grid-template-columns: 1fr;
  }

  .workspace__menu-button {
    display: inline-flex;
  }

  .workspace__layout {
    grid-template-columns: 1fr;
  }

  .workspace__sidebar {
    position: static;
  }

  .workspace__nav,
  .workspace__summary-card {
    display: none;
  }
}
</style>
