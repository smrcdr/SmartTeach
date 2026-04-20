<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import GroupModuleBadges from '../../features/groups/components/GroupModuleBadges.vue'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import {
  formatGroupDateTimeRange,
  formatMembersCount,
  getEnabledGroupModules,
  getGroupMembershipRoleLabel,
  groupAccessModeLabels,
  groupStatusLabels,
  scheduleEntryTypeLabels,
} from '../../features/groups/lib/groups.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const group = computed(() => workspace.group.value)
const settings = computed(() => workspace.settings.value)
const moduleLabels = computed(() => (settings.value ? getEnabledGroupModules(settings.value) : []))
const membershipLabel = computed(() => getGroupMembershipRoleLabel(workspace.membershipRole.value))
const ownerLabel = computed(() => group.value?.owner.displayName ?? 'Не удалось определить владельца')
const upcomingEntries = computed(() => workspace.upcomingEntries.value)
const groupLead = computed(
  () => normalizeOptionalText(group.value?.description) || 'Операционная сводка группы: состав, код доступа, модули и ближайшие активности.',
)

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}
</script>

<template>
  <div v-if="group && settings" class="page-shell">
    <header class="overview-header">
      <span class="page-eyebrow">Рабочее пространство / Обзор</span>
      <h1 class="page-title">{{ group.name }}</h1>
      <p class="page-lead">{{ groupLead }}</p>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа переведена в архив. Рабочее пространство работает только на чтение: просмотр доступен, а действия
      редактирования скрываются централизованно.
    </div>

    <div class="overview-layout">
      <AppCard class="overview-card">
        <div class="overview-card__header">
          <div>
            <h2 class="overview-card__title">Контекст группы</h2>
            <p class="muted">Быстрый срез по группе до перехода в отдельные разделы.</p>
          </div>

          <span class="overview-card__code">{{ group.code }}</span>
        </div>

        <div class="overview-stats">
          <div class="overview-stat">
            <div class="overview-stat__icon">
              <span class="material-symbols-outlined">groups</span>
            </div>
            <div class="overview-stat__body">
              <strong class="overview-stat__value">{{ formatMembersCount(group.membersCount) }}</strong>
              <span class="overview-stat__label">Состав</span>
            </div>
          </div>

          <div class="overview-stat">
            <div class="overview-stat__icon">
              <span class="material-symbols-outlined">person</span>
            </div>
            <div class="overview-stat__body">
              <strong class="overview-stat__value">{{ membershipLabel }}</strong>
              <span class="overview-stat__label">Моя роль</span>
            </div>
          </div>

          <div class="overview-stat">
            <div class="overview-stat__icon overview-stat__icon--success">
              <span class="material-symbols-outlined">check_circle</span>
            </div>
            <div class="overview-stat__body">
              <strong class="overview-stat__value">{{ groupStatusLabels[group.status] }}</strong>
              <span class="overview-stat__label">Статус группы</span>
            </div>
          </div>
        </div>

        <div class="overview-details">
          <div class="overview-detail">
            <span class="overview-detail__title">Детали группы</span>
            <div class="overview-detail__rows">
              <div class="overview-detail__row">
                <span class="overview-detail__meta">
                  <span class="material-symbols-outlined">person</span>
                  Владелец
                </span>
                <strong>{{ ownerLabel }}</strong>
              </div>

              <div class="overview-detail__row">
                <span class="overview-detail__meta">
                  <span class="material-symbols-outlined">lock</span>
                  Режим доступа
                </span>
                <strong>{{ groupAccessModeLabels[group.accessMode] }}</strong>
              </div>
            </div>
          </div>

          <div class="overview-detail overview-detail--modules">
            <span class="overview-detail__title">Активные модули</span>
            <GroupModuleBadges :modules="moduleLabels" />
          </div>
        </div>
      </AppCard>

      <AppCard class="upcoming-card">
        <div class="upcoming-card__header">
          <div>
            <h2 class="overview-card__title">Ближайшие события</h2>
          </div>

          <AppButton
            v-if="workspace.canManageGroup.value && workspace.isScheduleModuleEnabled.value && !workspace.isReadOnly.value"
            variant="secondary"
            :to="{
              name: 'group-schedule-event-create',
              params: { groupId },
            }"
          >
            Добавить событие
          </AppButton>
        </div>

        <AppEmptyState
          v-if="!workspace.isScheduleModuleEnabled.value"
          title="Расписание выключено"
          :description="
            workspace.canManageGroup.value && !workspace.isReadOnly.value
              ? 'Пока модуль выключен, обзор не собирает ближайшие уроки, дедлайны и пользовательские события. Его можно включить в настройках группы.'
              : 'Пока модуль выключен, обзор не собирает ближайшие уроки, дедлайны и пользовательские события.'
          "
        >
          <template v-if="workspace.canManageGroup.value && !workspace.isReadOnly.value" #actions>
            <AppButton
              variant="secondary"
              :to="{
                name: 'group-settings',
                params: {
                  groupId,
                },
              }"
            >
              Открыть настройки
            </AppButton>
          </template>
        </AppEmptyState>

        <AppErrorState
          v-else-if="workspace.scheduleQuery.error.value"
          title="Не удалось загрузить календарь группы"
          description="Обзор останется доступным, но блок ближайших событий сейчас недоступен."
        />

        <AppLoader
          v-else-if="workspace.scheduleQuery.isPending.value"
          label="Собираем уроки, дедлайны и события группы"
        />

        <AppEmptyState
          v-else-if="upcomingEntries.length === 0"
          title="Пока нет ближайших событий"
          description="Когда в группе появятся уроки, дедлайны или пользовательские события, они будут собираться здесь в единую сводку."
        >
          <template #media>
            <div class="upcoming-empty__icon">
              <span class="material-symbols-outlined">calendar_month</span>
            </div>
          </template>
        </AppEmptyState>

        <ul v-else class="upcoming-list">
          <li v-for="entry in upcomingEntries" :key="entry.sourceId" class="upcoming-list__item">
            <div class="upcoming-list__meta">
              <span class="pill">{{ scheduleEntryTypeLabels[entry.sourceType] }}</span>
              <strong>{{ entry.title }}</strong>
            </div>

            <p class="muted">
              {{ formatGroupDateTimeRange(entry.startsAt, normalizeOptionalText(entry.endsAt) || null) }}
            </p>
            <p v-if="normalizeOptionalText(entry.description)" class="upcoming-list__description">
              {{ normalizeOptionalText(entry.description) }}
            </p>
          </li>
        </ul>
      </AppCard>

    </div>
  </div>
</template>

<style scoped>
.overview-header {
  display: grid;
  gap: 0.35rem;
}

.overview-layout {
  display: grid;
  gap: 1rem;
}

.overview-card,
.upcoming-card {
  gap: 1.25rem;
  padding: 1.35rem;
  background: #f6fbff;
}

.overview-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.overview-card__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.overview-card__code {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.72rem;
  border-radius: var(--radius-pill);
  background: var(--color-panel-muted);
  color: var(--color-accent-strong);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.overview-stat {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.95rem;
  align-items: start;
  min-height: 8.1rem;
  padding: 1.15rem 1.05rem 1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, #eef6fd 0%, #edf4fb 100%);
}

.overview-stat__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: #e3effb;
  color: #2f6d97;
}

.overview-stat__icon .material-symbols-outlined {
  font-size: 1.3rem;
}

.overview-stat__icon--success {
  background: #e6f6ea;
  color: #3d8b58;
}

.overview-stat__body {
  display: grid;
  align-content: end;
  gap: 0.28rem;
  min-height: 100%;
}

.overview-stat__value {
  font-size: 1.95rem;
  line-height: 1.04;
  letter-spacing: -0.04em;
  color: var(--color-text);
}

.overview-stat__label {
  color: var(--color-subtle);
  font-size: 0.94rem;
}

.overview-details {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 1.1rem;
  padding-top: 0.15rem;
  border-top: 1px solid rgba(185, 199, 213, 0.7);
}

.overview-detail {
  display: grid;
  gap: 0.9rem;
}

.overview-detail--modules {
  padding-left: 1.1rem;
  border-left: 1px solid rgba(185, 199, 213, 0.7);
}

.overview-detail__title {
  font-weight: 700;
  color: var(--color-text);
}

.overview-detail__rows {
  display: grid;
  gap: 0.8rem;
}

.overview-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.overview-detail__meta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--color-subtle);
}

.overview-detail__meta .material-symbols-outlined {
  font-size: 1.05rem;
}

.upcoming-list {
  display: grid;
  gap: 0.9rem;
}

.upcoming-list__item {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.56);
}

.upcoming-list__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.upcoming-list__description {
  color: var(--color-subtle);
}

.upcoming-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.upcoming-empty__icon {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  margin: 0 auto;
  border-radius: 999px;
  background: #edf5fc;
  color: #6d8aa5;
}

.upcoming-empty__icon .material-symbols-outlined {
  font-size: 2rem;
}

@media (max-width: 900px) {
  .overview-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-details {
    grid-template-columns: 1fr;
  }

  .overview-detail--modules {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid rgba(185, 199, 213, 0.7);
    padding-top: 1rem;
  }

  .upcoming-card__header,
  .overview-card__header,
  .overview-detail__row {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .overview-stats {
    grid-template-columns: 1fr;
  }

  .overview-stat {
    min-height: auto;
  }

  .overview-stat__value {
    font-size: 1.5rem;
  }
}
</style>
