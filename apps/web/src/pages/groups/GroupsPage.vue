<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import GroupCatalogCard from '../../features/groups/components/GroupCatalogCard.vue'
import MyGroupCard from '../../features/groups/components/MyGroupCard.vue'
import { useAuth } from '../../features/auth/composables/useAuth'
import { getGroupsErrorMessage, type GroupAccessMode } from '../../features/groups/api/groups.api'
import { useGroupsList } from '../../features/groups/composables/useGroups'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppInput from '../../shared/ui/AppInput.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

type GroupsTab = 'my' | 'all'
type MyGroupsStatus = 'ACTIVE' | 'ARCHIVED'
type CatalogAccessFilter = GroupAccessMode | ''

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()

const searchDraft = ref('')

const searchQuery = computed(() => normalizeRouteQueryValue(route.query.q))
const activeTab = computed<GroupsTab>(() => {
  const rawTab = normalizeRouteQueryValue(route.query.tab)

  if (rawTab === 'all' || rawTab === 'my') {
    return rawTab
  }

  return searchQuery.value ? 'all' : 'my'
})
const myStatusFilter = computed<MyGroupsStatus>(() =>
  normalizeRouteQueryValue(route.query.status) === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
)
const accessModeFilter = computed<CatalogAccessFilter>(() => {
  const rawAccessMode = normalizeRouteQueryValue(route.query.accessMode)

  if (rawAccessMode === 'OPEN' || rawAccessMode === 'BY_REQUEST' || rawAccessMode === 'CLOSED') {
    return rawAccessMode
  }

  return ''
})

watch(
  searchQuery,
  (value) => {
    searchDraft.value = value
  },
  {
    immediate: true,
  },
)

const joinedGroupsQuery = useGroupsList('joined')
const myGroupsQuery = useGroupsList(
  'joined',
  computed(() => ({
    search: searchQuery.value || undefined,
    status: myStatusFilter.value,
  })),
  {
    enabled: computed(() => activeTab.value === 'my'),
  },
)
const catalogGroupsQuery = useGroupsList(
  'visible',
  computed(() => ({
    search: searchQuery.value || undefined,
    accessMode: accessModeFilter.value || undefined,
  })),
  {
    enabled: computed(() => activeTab.value === 'all'),
  },
)

const joinedGroups = computed(() => joinedGroupsQuery.data.value ?? [])
const myGroups = computed(() => myGroupsQuery.data.value ?? [])
const catalogGroups = computed(() => catalogGroupsQuery.data.value ?? [])
const activeJoinedCount = computed(() => joinedGroups.value.filter((group) => group.status === 'ACTIVE').length)
const archivedJoinedCount = computed(() => joinedGroups.value.filter((group) => group.status === 'ARCHIVED').length)
const hasJoinedGroups = computed(() => joinedGroups.value.length > 0)
const isCurrentTabLoading = computed(
  () =>
    joinedGroupsQuery.isPending.value || (activeTab.value === 'my' ? myGroupsQuery.isPending.value : catalogGroupsQuery.isPending.value),
)
const currentError = computed(() => {
  if (joinedGroupsQuery.error.value) {
    return joinedGroupsQuery.error.value
  }

  return activeTab.value === 'my' ? myGroupsQuery.error.value : catalogGroupsQuery.error.value
})
const currentErrorMessage = computed(() =>
  currentError.value ? getGroupsErrorMessage(currentError.value, 'Не удалось загрузить раздел групп') : '',
)
const tabLead = computed(() =>
  activeTab.value === 'my'
    ? 'Рабочий список держит только ваши группы и не смешивает их с публичным каталогом.'
    : 'Каталог оставляет уже присоединённые группы видимыми, чтобы вход в рабочее пространство был без лишних переходов.',
)
const isGlobalSearchContext = computed(
  () => activeTab.value === 'all' && Boolean(searchQuery.value) && normalizeRouteQueryValue(route.query.tab) !== 'my',
)

async function submitSearch() {
  await pushGroupsQuery({
    tab: activeTab.value,
    q: searchDraft.value,
    status: myStatusFilter.value,
    accessMode: accessModeFilter.value,
  })
}

async function clearSearch() {
  searchDraft.value = ''

  await pushGroupsQuery({
    tab: activeTab.value,
    q: '',
    status: myStatusFilter.value,
    accessMode: accessModeFilter.value,
  })
}

async function setTab(tab: GroupsTab) {
  await pushGroupsQuery({
    tab,
    q: searchQuery.value,
    status: tab === 'my' ? myStatusFilter.value : 'ACTIVE',
    accessMode: tab === 'all' ? accessModeFilter.value : '',
  })
}

async function setMyStatusFilter(status: MyGroupsStatus) {
  await pushGroupsQuery({
    tab: 'my',
    q: searchQuery.value,
    status,
    accessMode: '',
  })
}

async function setAccessModeFilter(accessMode: CatalogAccessFilter) {
  await pushGroupsQuery({
    tab: 'all',
    q: searchQuery.value,
    status: 'ACTIVE',
    accessMode,
  })
}

async function refetchCurrentTab() {
  await joinedGroupsQuery.refetch()

  if (activeTab.value === 'my') {
    await myGroupsQuery.refetch()
    return
  }

  await catalogGroupsQuery.refetch()
}

async function pushGroupsQuery({
  tab = activeTab.value,
  q = searchQuery.value,
  status = myStatusFilter.value,
  accessMode = accessModeFilter.value,
}: {
  tab?: GroupsTab
  q?: string
  status?: MyGroupsStatus
  accessMode?: CatalogAccessFilter
}) {
  await router.push({
    name: 'groups',
    query: buildGroupsQuery(tab, q, status, accessMode),
  })
}

function buildGroupsQuery(tab: GroupsTab, q: string, status: MyGroupsStatus, accessMode: CatalogAccessFilter) {
  const normalizedQuery = q.trim()
  const nextQuery: Record<string, string> = {}

  if (normalizedQuery) {
    nextQuery.q = normalizedQuery
  }

  if (tab === 'all' || (tab === 'my' && normalizedQuery)) {
    nextQuery.tab = tab
  }

  if (tab === 'my' && status === 'ARCHIVED') {
    nextQuery.status = 'ARCHIVED'
  }

  if (tab === 'all' && accessMode) {
    nextQuery.accessMode = accessMode
  }

  return nextQuery
}

function normalizeRouteQueryValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}
</script>

<template>
  <div class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Groups</span>
      <h1 class="page-title">После входа SmartTeach начинает работу с раздела групп, а не с декоративного дашборда.</h1>
      <p class="page-lead">
        Раздел держит два сценария отдельно: быстрый рабочий список для своих групп и каталог для поиска новой группы
        или перехода по коду.
      </p>

      <div class="page-actions">
        <AppButton to="/groups/create">Создать группу</AppButton>
        <AppButton to="/groups/join" variant="secondary">Ввести код</AppButton>
      </div>
    </header>

    <div class="metric-grid">
      <AppCard>
        <div class="metric">
          <span class="metric__value">{{ activeJoinedCount }}</span>
          <span class="metric__label">Активные мои группы</span>
        </div>
      </AppCard>
      <AppCard>
        <div class="metric">
          <span class="metric__value">{{ archivedJoinedCount }}</span>
          <span class="metric__label">Архив в моём списке</span>
        </div>
      </AppCard>
      <AppCard>
        <div class="metric">
          <span class="metric__value">{{ joinedGroups.length }}</span>
          <span class="metric__label">Всего групп у меня</span>
        </div>
      </AppCard>
    </div>

    <div class="groups-toolbar">
      <div class="groups-tabs" role="tablist" aria-label="Разделы групп">
        <button
          type="button"
          :class="['groups-tab', { 'groups-tab--active': activeTab === 'my' }]"
          :aria-selected="activeTab === 'my'"
          @click="setTab('my')"
        >
          Мои
        </button>
        <button
          type="button"
          :class="['groups-tab', { 'groups-tab--active': activeTab === 'all' }]"
          :aria-selected="activeTab === 'all'"
          @click="setTab('all')"
        >
          Все
        </button>
      </div>
      <p class="muted">{{ tabLead }}</p>
    </div>

    <AppCard class="groups-controls">
      <form class="groups-controls__search" @submit.prevent="submitSearch">
        <AppInput
          v-model="searchDraft"
          :label="activeTab === 'my' ? 'Поиск по своим группам' : 'Поиск по каталогу'"
          :placeholder="activeTab === 'my' ? 'Название или описание группы' : 'Название, описание или найденный контекст'"
        />
        <div class="page-actions">
          <AppButton type="submit" size="sm">Применить</AppButton>
          <AppButton v-if="searchQuery" type="button" variant="ghost" size="sm" @click="clearSearch">Сбросить</AppButton>
        </div>
      </form>

      <div v-if="activeTab === 'my'" class="groups-controls__filters">
        <button
          type="button"
          :class="['filter-chip', { 'filter-chip--active': myStatusFilter === 'ACTIVE' }]"
          @click="setMyStatusFilter('ACTIVE')"
        >
          Активные
        </button>
        <button
          type="button"
          :class="['filter-chip', { 'filter-chip--active': myStatusFilter === 'ARCHIVED' }]"
          @click="setMyStatusFilter('ARCHIVED')"
        >
          Архив
        </button>
      </div>

      <div v-else class="groups-controls__filters">
        <button
          type="button"
          :class="['filter-chip', { 'filter-chip--active': accessModeFilter === '' }]"
          @click="setAccessModeFilter('')"
        >
          Все режимы
        </button>
        <button
          type="button"
          :class="['filter-chip', { 'filter-chip--active': accessModeFilter === 'OPEN' }]"
          @click="setAccessModeFilter('OPEN')"
        >
          Открытые
        </button>
        <button
          type="button"
          :class="['filter-chip', { 'filter-chip--active': accessModeFilter === 'BY_REQUEST' }]"
          @click="setAccessModeFilter('BY_REQUEST')"
        >
          По заявке
        </button>
        <button
          type="button"
          :class="['filter-chip', { 'filter-chip--active': accessModeFilter === 'CLOSED' }]"
          @click="setAccessModeFilter('CLOSED')"
        >
          Закрытые
        </button>
      </div>

      <div v-if="isGlobalSearchContext" class="panel-note">
        Глобальный поиск из topbar перевёл вас сразу в каталог, чтобы запрос применился к публично видимым группам.
      </div>
    </AppCard>

    <AppLoader v-if="isCurrentTabLoading" label="Загружаем группы и проверяем ваш контекст" />

    <AppErrorState
      v-else-if="currentErrorMessage"
      title="Не удалось открыть раздел групп"
      :description="currentErrorMessage"
    >
      <template #actions>
        <AppButton variant="secondary" @click="refetchCurrentTab">Повторить</AppButton>
      </template>
    </AppErrorState>

    <template v-else-if="activeTab === 'my'">
      <AppEmptyState
        v-if="!hasJoinedGroups"
        title="У вас пока нет ни одной группы"
        description="Начните с создания собственной группы, переключитесь в каталог или найдите нужную группу по коду."
      >
        <template #actions>
          <AppButton to="/groups/create">Создать группу</AppButton>
          <AppButton variant="secondary" @click="setTab('all')">Найти группу</AppButton>
          <AppButton to="/groups/join" variant="ghost">Ввести код</AppButton>
        </template>
      </AppEmptyState>

      <AppEmptyState
        v-else-if="myGroups.length === 0"
        title="Под текущие фильтры ничего не найдено"
        description="Сбросьте поиск или переключите статус списка, чтобы вернуться к рабочим группам."
      >
        <template #actions>
          <AppButton v-if="searchQuery" variant="secondary" @click="clearSearch">Очистить поиск</AppButton>
          <AppButton v-if="myStatusFilter === 'ARCHIVED'" variant="ghost" @click="setMyStatusFilter('ACTIVE')">
            Показать активные
          </AppButton>
          <AppButton v-else variant="ghost" @click="setMyStatusFilter('ARCHIVED')">Открыть архив</AppButton>
        </template>
      </AppEmptyState>

      <div v-else class="groups-grid">
        <MyGroupCard
          v-for="group in myGroups"
          :key="group.id"
          :group="group"
          :current-user-id="currentUser?.id ?? null"
        />
      </div>
    </template>

    <template v-else>
      <AppEmptyState
        v-if="catalogGroups.length === 0"
        title="Каталог не нашёл подходящих групп"
        description="Измените строку поиска или верните все режимы доступа, чтобы увидеть больше доступных групп."
      >
        <template #actions>
          <AppButton v-if="searchQuery" variant="secondary" @click="clearSearch">Очистить поиск</AppButton>
          <AppButton v-if="accessModeFilter" variant="ghost" @click="setAccessModeFilter('')">Снять фильтр доступа</AppButton>
          <AppButton v-if="!searchQuery && !accessModeFilter" to="/groups/join" variant="secondary">Ввести код</AppButton>
          <AppButton v-if="!searchQuery && !accessModeFilter" to="/groups/create" variant="ghost">Создать группу</AppButton>
        </template>
      </AppEmptyState>

      <div v-else class="groups-grid">
        <GroupCatalogCard
          v-for="group in catalogGroups"
          :key="group.id"
          :group="group"
          :is-joined="Boolean(group.viewerMembershipRole)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.groups-toolbar {
  display: grid;
  gap: 0.75rem;
}

.groups-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.groups-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.85rem;
  padding: 0.72rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-panel);
  color: var(--color-subtle);
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.groups-tab--active {
  border-color: rgba(31, 117, 156, 0.2);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.groups-controls {
  gap: 1.25rem;
}

.groups-controls__search {
  display: grid;
  gap: 1rem;
}

.groups-controls__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.4rem;
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-panel-muted);
  color: var(--color-subtle);
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.filter-chip--active {
  border-color: rgba(31, 117, 156, 0.2);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 980px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }
}
</style>
