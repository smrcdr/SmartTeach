<template>
  <div>
    <AppTopNav />
    <aside v-if="group" class="workspace-nav">
      <RouterLink to="/my-groups" class="workspace-nav__brand">
        <span>{{ initials }}</span>
        <div>
          <strong>{{ group.name }}</strong>
          <small>{{ group.code }}</small>
        </div>
      </RouterLink>

      <nav aria-label="Навигация группы">
        <RouterLink
          v-for="item in visibleNavItems"
          :key="item.key"
          :to="{ name: item.toName, params: { groupId: group.id } }"
          :class="['workspace-nav__item', { 'workspace-nav__item--active': isNavItemActive(item) }]"
          active-class=""
          exact-active-class=""
        >
          <component :is="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="workspace-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { groupWorkspaceNav } from '@/app/router/routes'
import type { Group } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import AppTopNav from '@/shared/ui/AppTopNav.vue'

type GroupWorkspaceNavItem = (typeof groupWorkspaceNav)[number]

const route = useRoute()
const router = useRouter()
const { group } = useGroup()
const initials = computed(() => group.value?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('') ?? '')
const visibleNavItems = computed(() => {
  return groupWorkspaceNav.filter((item) => isNavItemVisible(item, group.value))
})

function isModuleEnabled(item: GroupWorkspaceNavItem, currentGroup: Group | null) {
  if (!('settingKey' in item)) {
    return true
  }

  return Boolean(currentGroup?.settings[item.settingKey])
}

function isNavItemVisible(item: GroupWorkspaceNavItem, currentGroup: Group | null) {
  const isAdminAllowed = !('adminOnly' in item) || !item.adminOnly || canManageGroup(currentGroup)

  return isAdminAllowed && isModuleEnabled(item, currentGroup)
}

function findCurrentNavItem() {
  const routeName = String(route.name ?? '')

  return groupWorkspaceNav.find((item) => (item.activeNames as readonly string[]).includes(routeName)) ?? null
}

function isNavItemActive(item: GroupWorkspaceNavItem) {
  return (item.activeNames as readonly string[]).includes(String(route.name ?? ''))
}

watch([() => route.name, () => group.value], () => {
  const currentGroup = group.value
  const currentItem = findCurrentNavItem()

  if (!currentGroup || !currentItem || !('settingKey' in currentItem) || isModuleEnabled(currentItem, currentGroup)) {
    return
  }

  void router.replace({
    name: 'group-workspace',
    params: {
      groupId: currentGroup.id
    }
  })
}, { immediate: true })
</script>

<style scoped>
.workspace-nav {
  --workspace-nav-divider: color-mix(in srgb, var(--color-divider) 58%, var(--color-outline) 42%);
  background: var(--color-surface-low);
  border-right: 1px solid var(--workspace-nav-divider);
  bottom: 0;
  box-shadow: 1px 0 0 color-mix(in srgb, var(--workspace-nav-divider) 42%, transparent);
  display: flex;
  flex-direction: column;
  gap: 24px;
  left: 0;
  padding: 88px 16px 24px;
  position: fixed;
  top: 0;
  width: 270px;
  z-index: 20;
}

.workspace-nav__brand {
  align-items: center;
  border-radius: var(--radius-lg);
  display: flex;
  gap: 12px;
  padding: 12px;
}

.workspace-nav__brand > span {
  align-items: center;
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  color: #fff;
  display: inline-flex;
  font-weight: 850;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.workspace-nav__brand strong,
.workspace-nav__brand small {
  display: block;
}

.workspace-nav__brand strong {
  color: var(--color-primary);
  font-size: 0.9rem;
  line-height: 1.2;
}

.workspace-nav__brand small {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  margin-top: 3px;
}

.workspace-nav nav {
  display: grid;
  gap: 6px;
}

.workspace-nav__item {
  align-items: center;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  display: flex;
  font-size: 0.94rem;
  font-weight: 700;
  gap: 12px;
  min-height: 46px;
  padding: 0 14px;
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.workspace-nav__item:hover {
  background: var(--color-surface-highest);
  transform: translateX(2px);
}

.workspace-nav__item--active {
  background: var(--color-primary-container);
  box-shadow: var(--shadow-action-primary);
  color: var(--color-action-primary-text);
}

.workspace-nav__item--active:hover {
  background: var(--color-primary-container);
  color: var(--color-action-primary-text);
}

.workspace-main {
  margin-left: 270px;
  min-height: 100vh;
}

:deep(.page) {
  max-width: 1240px;
}

@media (max-width: 980px) {
  .workspace-nav {
    bottom: auto;
    border-bottom: 1px solid var(--workspace-nav-divider);
    border-right: 0;
    box-shadow: 0 1px 0 color-mix(in srgb, var(--workspace-nav-divider) 42%, transparent);
    flex-direction: row;
    overflow-x: auto;
    padding: 74px 16px 12px;
    right: 0;
    top: 0;
    width: auto;
  }

  .workspace-nav__brand {
    min-width: 220px;
  }

  .workspace-nav nav {
    display: flex;
  }

  .workspace-nav__item {
    min-width: max-content;
  }

  .workspace-main {
    margin-left: 0;
    padding-top: 92px;
  }
}
</style>
