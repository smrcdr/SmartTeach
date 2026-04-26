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
          v-for="item in groupWorkspaceNav"
          :key="item.key"
          :to="{ name: item.toName, params: { groupId: group.id } }"
          class="workspace-nav__item"
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
import { computed } from 'vue'
import { groupWorkspaceNav } from '@/app/router/routes'
import { useGroup } from '@/features/groups/composables/useGroup'
import AppTopNav from '@/shared/ui/AppTopNav.vue'

const { group } = useGroup()
const initials = computed(() => group.value?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('') ?? '')
</script>

<style scoped>
.workspace-nav {
  background: var(--color-surface-low);
  bottom: 0;
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

.workspace-nav__item.router-link-active {
  background: var(--color-primary);
  box-shadow: 0 18px 34px -20px rgb(21 25 108 / 60%);
  color: #fff;
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
