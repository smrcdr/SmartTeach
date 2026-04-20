<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import GroupCatalogCard from '../../features/groups/components/GroupCatalogCard.vue'
import { useAuth } from '../../features/auth/composables/useAuth'
import { getGroupsErrorMessage, type Group, type GroupAccessMode } from '../../features/groups/api/groups.api'
import { useGroupsList } from '../../features/groups/composables/useGroups'
import AppButton from '../../shared/ui/AppButton.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

type MyGroupsStatus = 'ACTIVE' | 'ARCHIVED'
type CatalogAccessFilter = GroupAccessMode | ''
type GroupsPageMode = 'home' | 'catalog' | 'my'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()
const isAuthenticated = computed(() => Boolean(currentUser.value))

const searchDraft = ref('')
const guestRecommendedGroups: Group[] = [
  buildGuestGroup({
    id: '00000000-0000-4000-8000-000000000101',
    code: 'PYLAB24',
    name: 'Python Lab: Практика с нуля',
    description: 'Короткий трек для первых проектов на Python, упражнений по синтаксису и разборов ошибок.',
    ownerId: '00000000-0000-4000-8000-000000000901',
    ownerName: 'Arminis Karner',
    accessMode: 'OPEN',
    membersCount: 1700,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: false,
    },
  }),
  buildGuestGroup({
    id: '00000000-0000-4000-8000-000000000102',
    code: 'DESN31',
    name: 'Graphic Design Basics',
    description: 'Основа визуальной композиции, работа с цветом и практика на небольших digital-задачах.',
    ownerId: '00000000-0000-4000-8000-000000000902',
    ownerName: 'Alex Xi Nane',
    accessMode: 'BY_REQUEST',
    membersCount: 17000,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: false,
      scheduleEnabled: true,
    },
  }),
  buildGuestGroup({
    id: '00000000-0000-4000-8000-000000000103',
    code: 'EUHIST',
    name: 'History of Europe: Modern Age',
    description: 'Группа для изучения ключевых событий Европы нового времени с лекциями и обсуждениями.',
    ownerId: '00000000-0000-4000-8000-000000000903',
    ownerName: 'Kemalia Hamira',
    accessMode: 'OPEN',
    membersCount: 17100,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: false,
      scheduleEnabled: false,
    },
  }),
  buildGuestGroup({
    id: '00000000-0000-4000-8000-000000000104',
    code: 'REACT9',
    name: 'React Dev Course',
    description: 'Практический поток по компонентной архитектуре, состоянию, маршрутизации и продакшн-паттернам.',
    ownerId: '00000000-0000-4000-8000-000000000904',
    ownerName: 'Alex Munnar',
    accessMode: 'BY_REQUEST',
    membersCount: 22000,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
    },
  }),
  buildGuestGroup({
    id: '00000000-0000-4000-8000-000000000105',
    code: 'ALG101',
    name: 'Math 101: Algebra',
    description: 'Разбор базовых алгебраических тем, регулярные задачи и поддержка в групповом формате.',
    ownerId: '00000000-0000-4000-8000-000000000905',
    ownerName: 'Aman Dannen',
    accessMode: 'OPEN',
    membersCount: 4000,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: true,
      scheduleEnabled: true,
    },
  }),
  buildGuestGroup({
    id: '00000000-0000-4000-8000-000000000106',
    code: 'LITB1',
    name: 'English Literature B1',
    description: 'Чтение, словарь, обсуждения текстов и поддержка языковой практики в одной группе.',
    ownerId: '00000000-0000-4000-8000-000000000906',
    ownerName: 'Aaran Stander',
    accessMode: 'CLOSED',
    membersCount: 3300,
    settings: {
      chatEnabled: true,
      lessonsEnabled: true,
      assignmentsEnabled: false,
      scheduleEnabled: true,
    },
  }),
  ...Array.from({ length: 25 }, (_value, index) => {
    const suffix = String(index + 1).padStart(2, '0')
    const accessModes: GroupAccessMode[] = ['OPEN', 'BY_REQUEST', 'CLOSED']

    return buildGuestGroup({
      id: `00000000-0000-4000-8000-0000000002${suffix}`,
      code: `DEMO${suffix}`,
      name: `Demo Study Group ${suffix}`,
      description: `Демо-группа ${suffix} для проверки длинных списков, карточной сетки и поведения каталога при большом количестве элементов.`,
      ownerId: `00000000-0000-4000-8000-0000000009${suffix}`,
      ownerName: `Curator ${suffix}`,
      accessMode: accessModes[index % accessModes.length],
      membersCount: 12 + index * 3,
      settings: {
        chatEnabled: true,
        lessonsEnabled: true,
        assignmentsEnabled: index % 2 === 0,
        scheduleEnabled: index % 3 !== 0,
      },
    })
  }),
]

const searchQuery = computed(() => normalizeRouteQueryValue(route.query.q))
const pageMode = computed<GroupsPageMode>(() => {
  if (route.name === 'my-groups') {
    return 'my'
  }

  if (route.name === 'catalog') {
    return 'catalog'
  }

  return 'home'
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

const joinedGroupsQuery = useGroupsList('joined', undefined, {
  enabled: isAuthenticated,
})
const myGroupsQuery = useGroupsList(
  'joined',
  computed(() => ({
    search: searchQuery.value || undefined,
    status: myStatusFilter.value,
  })),
  {
    enabled: computed(() => isAuthenticated.value && pageMode.value === 'my'),
  },
)
const catalogGroupsQuery = useGroupsList(
  'visible',
  computed(() => ({
    search: searchQuery.value || undefined,
    accessMode: accessModeFilter.value || undefined,
  })),
  {
    enabled: computed(() => isAuthenticated.value && (pageMode.value === 'catalog' || pageMode.value === 'home')),
  },
)

const joinedGroups = computed(() => joinedGroupsQuery.data.value ?? [])
const myGroups = computed(() => myGroupsQuery.data.value ?? [])
const catalogGroups = computed(() => catalogGroupsQuery.data.value ?? [])
const guestCatalogGroups = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase()

  return guestRecommendedGroups.filter((group) => {
    const matchesAccessMode = !accessModeFilter.value || group.accessMode === accessModeFilter.value
    const matchesQuery =
      !normalizedQuery ||
      group.name.toLowerCase().includes(normalizedQuery) ||
      String(group.description ?? '').toLowerCase().includes(normalizedQuery) ||
      group.owner.displayName.toLowerCase().includes(normalizedQuery)

    return matchesAccessMode && matchesQuery
  })
})
const activeJoinedCount = computed(() =>
  isAuthenticated.value
    ? joinedGroups.value.filter((group) => group.status === 'ACTIVE').length
    : guestCatalogGroups.value.filter((group) => group.status === 'ACTIVE').length,
)
const featuredSidebarGroups = computed(() =>
  isAuthenticated.value
    ? joinedGroups.value.filter((group) => group.status === 'ACTIVE').slice(0, 5)
    : guestCatalogGroups.value.slice(0, 5),
)
const currentGroups = computed(() => {
  if (!isAuthenticated.value || pageMode.value === 'home' || pageMode.value === 'catalog') {
    if (isAuthenticated.value && (pageMode.value === 'catalog' || pageMode.value === 'home')) {
      return catalogGroups.value
    }

    return guestCatalogGroups.value
  }

  return myGroups.value
})
const isCurrentTabLoading = computed(
  () =>
    isAuthenticated.value &&
    (joinedGroupsQuery.isPending.value ||
      (pageMode.value === 'my' ? myGroupsQuery.isPending.value : catalogGroupsQuery.isPending.value)),
)
const currentError = computed(() => {
  if (!isAuthenticated.value) {
    return null
  }

  if (joinedGroupsQuery.error.value) {
    return joinedGroupsQuery.error.value
  }

  return pageMode.value === 'my' ? myGroupsQuery.error.value : catalogGroupsQuery.error.value
})
const currentErrorMessage = computed(() =>
  currentError.value ? getGroupsErrorMessage(currentError.value, 'Не удалось загрузить раздел групп') : '',
)
const pageTitle = computed(() => {
  if (pageMode.value === 'my') {
    return 'Мои группы'
  }

  if (pageMode.value === 'catalog') {
    return 'Каталог групп'
  }

  if (!isAuthenticated.value) {
    return 'Рекомендованные группы'
  }

  return 'Главная'
})
const introCopy = computed(() =>
  pageMode.value === 'my'
    ? 'Управляйте активными и архивными группами в одном месте, быстро открывайте рабочие пространства и возвращайтесь к нужному потоку.'
    : pageMode.value === 'catalog'
      ? 'Просматривайте доступные группы, находите подходящий формат обучения и открывайте карточку группы без лишних переходов.'
      : !isAuthenticated.value
        ? 'Просматривайте подборку учебных групп в открытом режиме. Чтобы открыть рабочие пространства, чаты и личные разделы, достаточно войти в аккаунт.'
        : '',
)
const isGlobalSearchContext = computed(
  () => pageMode.value !== 'my' && Boolean(searchQuery.value),
)
const quickActions = computed(() =>
  isAuthenticated.value
    ? [
        {
          label: 'Мои чаты',
          description: 'Открыть личные и групповые диалоги',
          icon: 'chat',
          to: '/chats',
        },
        {
          label: 'Ввести код',
          description: 'Присоединиться к существующей группе',
          icon: 'key',
          to: '/groups/join',
        },
        {
          label: 'Профиль',
          description: 'Обновить имя, фото и описание',
          icon: 'person',
          to: '/profile',
        },
      ]
    : [
        {
          label: 'Войти',
          description: 'Открыть свои группы и приватные разделы',
          icon: 'login',
          to: '/login',
        },
        {
          label: 'Регистрация',
          description: 'Создать аккаунт и продолжить обучение',
          icon: 'person_add',
          to: '/register',
        },
        {
          label: 'Каталог',
          description: 'Смотреть рекомендации и фильтровать подборку',
          icon: 'grid_view',
          to: '/catalog',
        },
      ],
)
const sidebarGroupsTitle = computed(() => (isAuthenticated.value ? 'Мои активные группы' : 'Популярные группы'))
const sidebarGroupsEmptyDescription = computed(() =>
  isAuthenticated.value
    ? 'Когда вы присоединитесь к рабочим группам, они появятся в этой колонке.'
    : 'Подборка рекомендаций появится здесь. Попробуйте изменить строку поиска или фильтр доступа.',
)
const metricPrimaryLabel = computed(() => (isAuthenticated.value ? 'Активных групп' : 'Рекомендаций открыто'))
const metricSecondaryValue = computed(() => (isAuthenticated.value ? joinedGroups.value.length : guestRecommendedGroups.length))
const metricSecondaryLabel = computed(() => (isAuthenticated.value ? 'Всего в аккаунте' : 'Всего в подборке'))

async function submitSearch() {
  await pushGroupsQuery({
    q: searchDraft.value,
    status: myStatusFilter.value,
    accessMode: accessModeFilter.value,
  })
}

async function clearSearch() {
  searchDraft.value = ''

  await pushGroupsQuery({
    q: '',
    status: myStatusFilter.value,
    accessMode: accessModeFilter.value,
  })
}

async function setMyStatusFilter(status: MyGroupsStatus) {
  if (!isAuthenticated.value) {
    return
  }

  await pushGroupsQuery({
    q: searchQuery.value,
    status,
    accessMode: '',
  })
}

async function setAccessModeFilter(accessMode: CatalogAccessFilter) {
  await pushGroupsQuery({
    q: searchQuery.value,
    status: 'ACTIVE',
    accessMode,
  })
}

async function refetchCurrentTab() {
  if (!isAuthenticated.value) {
    return
  }

  await joinedGroupsQuery.refetch()

  if (pageMode.value === 'my') {
    await myGroupsQuery.refetch()
    return
  }

  await catalogGroupsQuery.refetch()
}

async function pushGroupsQuery({
  q = searchQuery.value,
  status = myStatusFilter.value,
  accessMode = accessModeFilter.value,
}: {
  q?: string
  status?: MyGroupsStatus
  accessMode?: CatalogAccessFilter
}) {
  const targetRouteName = pageMode.value === 'my' ? 'my-groups' : pageMode.value === 'catalog' ? 'catalog' : 'groups'

  await router.push({
    name: targetRouteName,
    query: buildGroupsQuery(q, status, accessMode),
  })
}

function buildGroupsQuery(q: string, status: MyGroupsStatus, accessMode: CatalogAccessFilter) {
  const normalizedQuery = q.trim()
  const nextQuery: Record<string, string> = {}

  if (normalizedQuery) {
    nextQuery.q = normalizedQuery
  }

  if (pageMode.value === 'my' && status === 'ARCHIVED') {
    nextQuery.status = 'ARCHIVED'
  }

  if ((pageMode.value === 'catalog' || pageMode.value === 'home') && accessMode) {
    nextQuery.accessMode = accessMode
  }

  return nextQuery
}

function normalizeRouteQueryValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function buildGuestGroup({
  id,
  code,
  name,
  description,
  ownerId,
  ownerName,
  accessMode,
  membersCount,
  settings,
}: {
  id: string
  code: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  accessMode: GroupAccessMode
  membersCount: number
  settings: Group['settings']
}): Group {
  const now = '2026-04-20T09:00:00.000Z'

  return {
    id,
    code,
    name,
    description,
    ownerId,
    owner: {
      id: ownerId,
      displayName: ownerName,
      bio: null,
      avatarFileId: null,
      avatarUrl: null,
    },
    accessMode,
    status: 'ACTIVE',
    settings,
    membersCount,
    viewerMembershipRole: null,
    viewerJoinRequestStatus: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    deletedAt: null,
  } as unknown as Group
}
</script>

<template>
  <main class="dashboard-layout">
    <div class="dashboard-two-column" :class="{ 'dashboard-two-column--sidebarless': pageMode === 'catalog' }">
      <section class="dashboard-main">
        <section class="intro catalog-intro">
          <h1>{{ pageTitle }}</h1>
          <p class="intro-copy">{{ introCopy }}</p>
        </section>

        <section class="catalog-layout">
          <aside v-if="pageMode !== 'home'" class="catalog-sidebar">
            <section class="filters-panel">
              <div v-if="isAuthenticated && pageMode === 'my'" class="filter-group">
                <span class="filter-title">Статус групп</span>

                <div class="filter-options filter-options-column">
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: myStatusFilter === 'ACTIVE' }"
                    @click="setMyStatusFilter('ACTIVE')"
                  >
                    Активные
                  </button>
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: myStatusFilter === 'ARCHIVED' }"
                    @click="setMyStatusFilter('ARCHIVED')"
                  >
                    Архивированные
                  </button>
                </div>
              </div>

              <div v-else-if="pageMode === 'catalog'" class="filter-group">
                <span class="filter-title">Режим доступа</span>

                <div class="filter-options">
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: accessModeFilter === '' }"
                    @click="setAccessModeFilter('')"
                  >
                    Все
                  </button>
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: accessModeFilter === 'OPEN' }"
                    @click="setAccessModeFilter('OPEN')"
                  >
                    Открытые
                  </button>
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: accessModeFilter === 'BY_REQUEST' }"
                    @click="setAccessModeFilter('BY_REQUEST')"
                  >
                    По заявке
                  </button>
                  <button
                    type="button"
                    class="filter-chip"
                    :class="{ active: accessModeFilter === 'CLOSED' }"
                    @click="setAccessModeFilter('CLOSED')"
                  >
                    Закрытые
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <section class="catalog-content" :class="{ 'catalog-content--full': pageMode === 'home' }">
            <div class="catalog-toolbar">
              <label class="catalog-search" aria-label="Поиск групп">
                <span class="material-symbols-outlined search-icon">search</span>
                <input
                  v-model="searchDraft"
                  type="text"
                  :placeholder="pageMode === 'my' ? 'Поиск моих групп...' : 'Поиск групп по названию...'"
                  @keydown.enter.prevent="submitSearch"
                />
              </label>

              <div v-if="isAuthenticated" class="catalog-toolbar__actions">
                <AppButton to="/groups/join" size="sm">Вступить по коду</AppButton>
              </div>
            </div>

            <section class="catalog-meta">
              <div class="groups-meta-actions">
                <AppButton v-if="searchQuery" type="button" variant="secondary" size="sm" @click="clearSearch">
                  Сбросить
                </AppButton>
              </div>
            </section>

            <div v-if="isGlobalSearchContext && pageMode === 'catalog'" class="panel-note">
              Поиск из верхней панели автоматически перевёл запрос в каталог доступных групп.
            </div>

            <AppLoader v-if="isCurrentTabLoading" label="Загружаем группы" />

            <AppErrorState
              v-else-if="currentErrorMessage"
              title="Не удалось открыть раздел групп"
              :description="currentErrorMessage"
            >
              <template #actions>
                <AppButton variant="secondary" @click="refetchCurrentTab">Повторить</AppButton>
              </template>
            </AppErrorState>

            <template v-else-if="isAuthenticated && pageMode === 'my'">
              <AppEmptyState
                v-if="joinedGroups.length === 0"
                title="У вас пока нет ни одной группы"
                description="Начните с создания новой группы или присоединитесь к существующей по коду приглашения."
              >
                <template #actions>
                  <AppButton to="/groups/create">Создать группу</AppButton>
                  <AppButton to="/groups/join" variant="secondary">Вступить по коду</AppButton>
                </template>
              </AppEmptyState>

              <AppEmptyState
                v-else-if="myGroups.length === 0"
                title="Под текущие фильтры ничего не найдено"
                description="Попробуйте очистить поиск или переключиться на другой статус списка."
              >
                <template #actions>
                  <AppButton v-if="searchQuery" variant="secondary" @click="clearSearch">Очистить поиск</AppButton>
                  <AppButton
                    v-if="myStatusFilter === 'ARCHIVED'"
                    variant="ghost"
                    @click="setMyStatusFilter('ACTIVE')"
                  >
                    Показать активные
                  </AppButton>
                </template>
              </AppEmptyState>

              <section
                v-else
                class="course-grid"
                :class="{
                  'course-grid--with-sidebar': true,
                }"
              >
                <GroupCatalogCard
                  v-for="group in myGroups"
                  :key="group.id"
                  :group="group"
                  :is-joined="true"
                />
              </section>
            </template>

            <template v-else>
              <AppEmptyState
                v-if="currentGroups.length === 0"
                :title="isAuthenticated ? 'Каталог не нашёл подходящих групп' : 'Рекомендации не найдены'"
                :description="
                  isAuthenticated
                    ? 'Измените строку поиска или режим доступа, чтобы увидеть больше доступных групп.'
                    : 'Измените строку поиска или режим доступа, чтобы увидеть больше рекомендаций.'
                "
              >
                <template #actions>
                  <AppButton v-if="searchQuery" variant="secondary" @click="clearSearch">Очистить поиск</AppButton>
                  <AppButton v-if="accessModeFilter" variant="ghost" @click="setAccessModeFilter('')">
                    Снять фильтр доступа
                  </AppButton>
                  <AppButton v-if="!isAuthenticated" to="/login">Войти</AppButton>
                </template>
              </AppEmptyState>

              <section
                v-else
                class="course-grid"
                :class="{
                  'course-grid--home': pageMode === 'home',
                  'course-grid--with-sidebar': pageMode !== 'home',
                  'course-grid--catalog': pageMode === 'catalog',
                }"
              >
                <GroupCatalogCard
                  v-for="group in currentGroups"
                  :key="group.id"
                  :group="group"
                  :is-joined="Boolean(group.viewerMembershipRole)"
                />
              </section>
            </template>
          </section>
        </section>
      </section>

      <aside v-if="pageMode !== 'catalog'" class="dashboard-sidebar sidebar">
        <section v-if="false" class="sidebar-panel">
          <div class="panel-heading">
            <h2>Quick Actions</h2>
          </div>

          <div class="action-list">
            <RouterLink v-for="action in quickActions" :key="action.to" :to="action.to" class="action-card">
              <span class="action-icon material-symbols-outlined">{{ action.icon }}</span>
              <div>
                <strong>{{ action.label }}</strong>
                <small>{{ action.description }}</small>
              </div>
            </RouterLink>
          </div>
        </section>

        <section v-if="pageMode !== 'home'" class="sidebar-panel">
          <div class="panel-heading">
            <h2>{{ sidebarGroupsTitle }}</h2>
          </div>

          <div v-if="featuredSidebarGroups.length > 0" class="group-list">
            <RouterLink
              v-for="group in featuredSidebarGroups"
              :key="group.id"
              :to="`/groups/${group.id}/overview`"
              class="group-card"
            >
              <span class="group-icon material-symbols-outlined">school</span>
              <div class="group-copy">
                <strong>{{ group.name }}</strong>
                <small>{{ group.code }}</small>
              </div>
              <span class="group-count">{{ group.membersCount }}</span>
            </RouterLink>
          </div>

          <AppEmptyState
            v-else
            title="Активных групп пока нет"
            :description="sidebarGroupsEmptyDescription"
          />
        </section>

        <section v-if="pageMode !== 'home'" class="sidebar-panel">
          <div class="panel-heading">
            <h2>Общий контекст</h2>
          </div>

          <div class="groups-sidebar-metrics">
            <article class="metric">
              <strong class="metric__value">{{ activeJoinedCount }}</strong>
              <span class="metric__label">{{ metricPrimaryLabel }}</span>
            </article>
            <article class="metric">
              <strong class="metric__value">{{ metricSecondaryValue }}</strong>
              <span class="metric__label">{{ metricSecondaryLabel }}</span>
            </article>
          </div>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.dashboard-two-column--sidebarless {
  grid-template-columns: minmax(0, 1fr);
}

.catalog-content--full {
  grid-column: 1 / -1;
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.catalog-toolbar :deep(.catalog-search) {
  margin-bottom: 0;
}

.catalog-toolbar__actions {
  flex-shrink: 0;
}

.course-grid--home {
  justify-content: center;
}

.course-grid--with-sidebar {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.course-grid--catalog {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.groups-meta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-list,
.group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card,
.group-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  background: #f9fbfd;
  border: 1px solid #c6d3df;
  border-radius: 18px;
  text-align: left;
}

.action-icon,
.group-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #c5d2de;
  font-size: 1.15rem;
}

.action-card strong,
.group-copy strong {
  display: block;
  font-size: 1rem;
  line-height: 1.15;
}

.action-card small,
.group-copy small {
  color: var(--color-subtle);
  font-size: 0.86rem;
}

.panel-heading h2 {
  margin-bottom: 14px;
  font-size: 1.8rem;
  line-height: 1.05;
  letter-spacing: -0.05em;
}

.group-count {
  color: #4f89dd;
  font-weight: 800;
}

.groups-sidebar-metrics {
  display: grid;
  gap: 12px;
}

@media (max-width: 760px) {
  .course-grid--with-sidebar {
    grid-template-columns: 1fr;
  }

  .course-grid--catalog {
    grid-template-columns: 1fr;
  }

  .catalog-toolbar {
    flex-wrap: wrap;
  }

  .groups-meta-actions {
    width: 100%;
  }
}
</style>
