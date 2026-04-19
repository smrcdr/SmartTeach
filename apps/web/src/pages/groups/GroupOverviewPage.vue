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

const route = useRoute()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const group = computed(() => workspace.group.value)
const settings = computed(() => workspace.settings.value)
const moduleLabels = computed(() => (settings.value ? getEnabledGroupModules(settings.value) : []))
const membershipLabel = computed(() => getGroupMembershipRoleLabel(workspace.membershipRole.value))
const ownerLabel = computed(() => group.value?.owner.displayName ?? 'Не удалось определить владельца')
const quickLinks = computed(() => workspace.primaryNavItems.value.slice(0, 5))
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
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Overview</span>
      <h1 class="page-title">{{ group.name }}</h1>
      <p class="page-lead">{{ groupLead }}</p>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа переведена в архив. Workspace должен работать как read-only: просмотр доступен, а редактирующие CTA
      скрываются централизованно.
    </div>

    <div class="section-grid">
      <AppCard class="span-8 overview-card">
        <div class="overview-card__header">
          <div>
            <h2 class="overview-card__title">Контекст группы</h2>
            <p class="muted">Базовая информация, которую участник должен видеть до перехода в отдельные модули.</p>
          </div>

          <span class="overview-card__code">{{ group.code }}</span>
        </div>

        <div class="metric-grid">
          <div class="metric">
            <span class="metric__value">{{ formatMembersCount(group.membersCount) }}</span>
            <span class="metric__label">Состав</span>
          </div>

          <div class="metric">
            <span class="metric__value">{{ membershipLabel }}</span>
            <span class="metric__label">Моя роль</span>
          </div>

          <div class="metric">
            <span class="metric__value">{{ groupStatusLabels[group.status] }}</span>
            <span class="metric__label">Статус</span>
          </div>
        </div>

        <div class="overview-meta">
          <div class="overview-meta__item">
            <span class="overview-meta__label">Владелец</span>
            <strong>{{ ownerLabel }}</strong>
          </div>

          <div class="overview-meta__item">
            <span class="overview-meta__label">Режим доступа</span>
            <strong>{{ groupAccessModeLabels[group.accessMode] }}</strong>
          </div>

          <div class="overview-meta__item">
            <span class="overview-meta__label">Модули</span>
            <GroupModuleBadges :modules="moduleLabels" />
          </div>
        </div>
      </AppCard>

      <AppCard tone="accent" class="span-4 quick-links">
        <h2 class="overview-card__title">Быстрые переходы</h2>
        <p class="muted">Показываются только разделы, доступные в текущей группе и вашей роли.</p>

        <div class="quick-links__list">
          <AppButton
            v-for="item in quickLinks"
            :key="item.key"
            :to="item.to"
            variant="secondary"
            block
          >
            {{ item.label }}
          </AppButton>
        </div>
      </AppCard>

      <AppCard class="span-8 upcoming-card">
        <h2 class="overview-card__title">Ближайшие события</h2>
        <p class="muted">Единая сводка по урокам, дедлайнам и пользовательским событиям на ближайший горизонт.</p>

        <AppEmptyState
          v-if="!workspace.isScheduleModuleEnabled.value"
          title="Расписание выключено"
          :description="
            workspace.canManageGroup.value && !workspace.isReadOnly.value
              ? 'Пока модуль выключен, overview не собирает ближайшие уроки, дедлайны и custom events. Его можно включить в настройках группы.'
              : 'Пока модуль выключен, overview не собирает ближайшие уроки, дедлайны и custom events.'
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
          description="Overview останется доступным, но блок ближайших событий сейчас недоступен."
        />

        <div v-else-if="workspace.scheduleQuery.isPending.value" class="upcoming-card__loading">
          Собираем уроки, дедлайны и события группы.
        </div>

        <AppEmptyState
          v-else-if="upcomingEntries.length === 0"
          title="Пока нет ближайших событий"
          description="Когда в группе появятся уроки, дедлайны или custom events, они будут собираться здесь в единую сводку."
        />

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

      <AppCard class="span-4 workspace-cues">
        <h2 class="overview-card__title">Ориентиры workspace</h2>
        <ul class="list-copy">
          <li>Outsider не попадает внутрь workspace и уходит в preview ещё на уровне route guard.</li>
          <li>Выключенные модули исчезают из боковой навигации и быстрых переходов.</li>
          <li>Архивная группа централизованно отмечается как read-only для всех внутренних разделов.</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.overview-card,
.quick-links,
.upcoming-card,
.workspace-cues {
  gap: 1.2rem;
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

.overview-meta {
  display: grid;
  gap: 1rem;
}

.overview-meta__item {
  display: grid;
  gap: 0.45rem;
}

.overview-meta__label {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.quick-links__list {
  display: grid;
  gap: 0.75rem;
}

.upcoming-card__loading {
  color: var(--color-subtle);
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
</style>
