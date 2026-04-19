<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getGroupsErrorMessage, type ListGroupScheduleQuery, type ScheduleEntry } from '../../features/groups/api/groups.api'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import { useGroupSchedule } from '../../features/groups/composables/useGroups'
import { getScheduleErrorMessage, type ListScheduleEventsQuery } from '../../features/schedule/api/schedule.api'
import ScheduleEventStatusBadge from '../../features/schedule/components/ScheduleEventStatusBadge.vue'
import { useScheduleEventsList } from '../../features/schedule/composables/useSchedule'
import {
  formatScheduleDateTime,
  formatScheduleEntryTiming,
  getScheduleDayKey,
  getScheduleEntryFallbackDescription,
  groupScheduleEntriesByDay,
  normalizeOptionalText,
  scheduleEntryTypeLabels,
  sortScheduleEntries,
} from '../../features/schedule/lib/schedule.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppEmptyState from '../../shared/ui/AppEmptyState.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

type ScheduleFilter = ScheduleEntry['sourceType']
type AgendaAction = {
  label: string
  to: {
    name: string
    params: Record<string, string>
  }
  variant?: 'primary' | 'secondary' | 'ghost'
}

const FULL_SCHEDULE_QUERY: Partial<ListGroupScheduleQuery> = {}
const CANCELLED_EVENTS_QUERY = {
  status: 'CANCELLED',
} as const satisfies Partial<ListScheduleEventsQuery>

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const activeFilters = ref<Record<ScheduleFilter, boolean>>({
  LESSON: true,
  ASSIGNMENT_DEADLINE: true,
  CUSTOM_EVENT: true,
})

const isScheduleModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.scheduleEnabled,
)
const canManageSchedule = computed(() => workspace.canManageGroup.value && !workspace.isReadOnly.value)
const scheduleQuery = useGroupSchedule(groupId, FULL_SCHEDULE_QUERY, {
  enabled: computed(
    () => workspace.isMember.value && Boolean(workspace.settings.value) && !isScheduleModuleUnavailable.value,
  ),
})
const cancelledEventsQuery = useScheduleEventsList(groupId, CANCELLED_EVENTS_QUERY, {
  enabled: computed(
    () => canManageSchedule.value && workspace.isMember.value && Boolean(workspace.settings.value) && !isScheduleModuleUnavailable.value,
  ),
})

const scheduleEntries = computed(() => sortScheduleEntries(scheduleQuery.data.value ?? []))
const filteredEntries = computed(() => scheduleEntries.value.filter((entry) => activeFilters.value[entry.sourceType]))
const groupedEntries = computed(() => groupScheduleEntriesByDay(filteredEntries.value))
const visibleDaysCount = computed(() => new Set(filteredEntries.value.map((entry) => getScheduleDayKey(entry.startsAt))).size)
const activeFilterCount = computed(() => Object.values(activeFilters.value).filter(Boolean).length)
const cancelledEvents = computed(() => cancelledEventsQuery.data.value ?? [])
const entryCounts = computed(() =>
  scheduleEntries.value.reduce<Record<ScheduleFilter, number>>(
    (counts, entry) => ({
      ...counts,
      [entry.sourceType]: counts[entry.sourceType] + 1,
    }),
    {
      LESSON: 0,
      ASSIGNMENT_DEADLINE: 0,
      CUSTOM_EVENT: 0,
    },
  ),
)
const scheduleErrorMessage = computed(() => {
  const error = scheduleQuery.error.value

  return error ? getGroupsErrorMessage(error, 'Не удалось загрузить agenda группы') : ''
})
const cancelledEventsErrorMessage = computed(() => {
  const error = cancelledEventsQuery.error.value

  return error ? getScheduleErrorMessage(error, 'Не удалось загрузить отменённые custom events') : ''
})
const emptyStateTitle = computed(() => {
  if (scheduleEntries.value.length === 0) {
    return canManageSchedule.value ? 'Лента расписания пока пуста' : 'Пока нет событий в расписании'
  }

  if (activeFilterCount.value === 0) {
    return 'Все типы записей скрыты'
  }

  return 'Для выбранных фильтров пока нет записей'
})
const emptyStateDescription = computed(() => {
  if (scheduleEntries.value.length === 0) {
    return canManageSchedule.value
      ? 'Создайте первое кастомное событие, а уроки и дедлайны появятся здесь автоматически, когда у них будут даты.'
      : 'Когда в группе появятся уроки с датой, дедлайны или кастомные события, они соберутся здесь по дням.'
  }

  if (activeFilterCount.value === 0) {
    return 'Включите хотя бы один быстрый фильтр, чтобы вернуть записи в agenda-ленту.'
  }

  return 'Попробуйте вернуть часть типов событий или дождитесь новых записей в этом диапазоне ленты.'
})

const filterOptions: Array<{
  label: string
  value: ScheduleFilter
}> = [
  {
    label: 'Уроки',
    value: 'LESSON',
  },
  {
    label: 'Дедлайны',
    value: 'ASSIGNMENT_DEADLINE',
  },
  {
    label: 'События',
    value: 'CUSTOM_EVENT',
  },
]

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isScheduleModuleUnavailable.value) {
    void router.replace({
      name: 'group-overview',
      params: {
        groupId: groupId.value,
      },
    })
  }
})

function toggleFilter(filter: ScheduleFilter) {
  activeFilters.value = {
    ...activeFilters.value,
    [filter]: !activeFilters.value[filter],
  }
}

function resetFilters() {
  activeFilters.value = {
    LESSON: true,
    ASSIGNMENT_DEADLINE: true,
    CUSTOM_EVENT: true,
  }
}

function getAgendaAction(entry: ScheduleEntry): AgendaAction | null {
  switch (entry.sourceType) {
    case 'LESSON':
      return {
        label: 'К уроку',
        to: {
          name: 'group-lesson-details',
          params: {
            groupId: groupId.value,
            lessonId: entry.sourceId,
          },
        },
        variant: 'secondary',
      }
    case 'ASSIGNMENT_DEADLINE':
      return {
        label: 'К заданию',
        to: {
          name: 'group-assignment-details',
          params: {
            groupId: groupId.value,
            assignmentId: entry.sourceId,
          },
        },
        variant: 'secondary',
      }
    case 'CUSTOM_EVENT':
      return canManageSchedule.value
        ? {
            label: 'Редактировать',
            to: {
              name: 'group-schedule-event-edit',
              params: {
                groupId: groupId.value,
                eventId: entry.sourceId,
              },
            },
            variant: 'ghost',
          }
        : null
  }
}

function getEntryDescription(entry: ScheduleEntry) {
  return normalizeOptionalText(entry.description) || getScheduleEntryFallbackDescription(entry)
}

function getCancelledEventMetaDescription(startsAt: string) {
  return `Начало ${formatScheduleDateTime(startsAt)}`
}

function formatEntryCount(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} запись`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} записи`
  }

  return `${count} записей`
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || isScheduleModuleUnavailable"
    label="Собираем schedule module и проверяем доступность agenda-ленты"
  />

  <AppErrorState
    v-else-if="scheduleErrorMessage"
    title="Не удалось загрузить расписание группы"
    :description="scheduleErrorMessage"
  >
    <template #actions>
      <AppButton variant="secondary" @click="scheduleQuery.refetch()">Повторить</AppButton>
    </template>
  </AppErrorState>

  <div v-else class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Schedule</span>
      <h1 class="page-title">Расписание работает как agenda-лента по дням, а не как декоративный month calendar.</h1>
      <p class="page-lead">
        В одном потоке собраны уроки, дедлайны заданий и кастомные события. Фильтры переключают типы без отдельного
        режима, а manager-роли получают отдельные create/edit flow для custom events.
      </p>

      <div v-if="canManageSchedule" class="page-actions">
        <AppButton
          :to="{
            name: 'group-schedule-event-create',
            params: {
              groupId,
            },
          }"
        >
          Создать событие
        </AppButton>
      </div>
    </header>

    <div v-if="workspace.isReadOnly.value" class="panel-note">
      Группа находится в архиве. Agenda и existing события остаются видимыми, но кнопки создания и редактирования
      скрыты до восстановления группы.
    </div>

    <div class="section-grid">
      <AppCard tone="accent" class="span-4 schedule-summary">
        <div class="schedule-summary__header">
          <h2 class="schedule-summary__title">Сводка agenda</h2>
          <p class="muted">Лента собирается по дням и не прячет типы событий за отдельными табами.</p>
        </div>

        <div class="schedule-summary__metrics">
          <div class="schedule-metric">
            <span class="schedule-metric__value">{{ scheduleEntries.length }}</span>
            <span class="schedule-metric__label">Всего записей</span>
          </div>
          <div class="schedule-metric">
            <span class="schedule-metric__value">{{ visibleDaysCount }}</span>
            <span class="schedule-metric__label">Дней в ленте</span>
          </div>
        </div>

        <dl class="schedule-summary__types">
          <div>
            <dt>Уроки</dt>
            <dd>{{ entryCounts.LESSON }}</dd>
          </div>
          <div>
            <dt>Дедлайны</dt>
            <dd>{{ entryCounts.ASSIGNMENT_DEADLINE }}</dd>
          </div>
          <div>
            <dt>События</dt>
            <dd>{{ entryCounts.CUSTOM_EVENT }}</dd>
          </div>
        </dl>

        <ul class="list-copy">
          <li>Уроки и дедлайны попадают сюда автоматически, если у записи есть дата.</li>
          <li v-if="canManageSchedule">Custom events создаются и редактируются в отдельных manager-only flow.</li>
          <li v-else>Custom events остаются видимыми всем участникам, но редактируются только owner/admin.</li>
        </ul>
      </AppCard>

      <AppCard class="span-8 schedule-toolbar">
        <div class="schedule-toolbar__header">
          <div>
            <h2 class="schedule-toolbar__title">Быстрые фильтры</h2>
            <p class="muted">
              Можно отключать отдельные типы, не теряя общего дневного порядка. По умолчанию включены все три потока.
            </p>
          </div>

          <AppButton v-if="activeFilterCount !== filterOptions.length" variant="secondary" size="sm" @click="resetFilters()">
            Сбросить
          </AppButton>
        </div>

        <div class="schedule-toolbar__filters">
          <button
            v-for="filter in filterOptions"
            :key="filter.value"
            type="button"
            :class="['schedule-filter', { 'schedule-filter--active': activeFilters[filter.value] }]"
            @click="toggleFilter(filter.value)"
          >
            <span>{{ filter.label }}</span>
            <span class="schedule-filter__count">{{ entryCounts[filter.value] }}</span>
          </button>
        </div>

        <p class="muted">
          {{
            activeFilterCount === 0
              ? 'Сейчас скрыты все типы записей.'
              : `В ленте видно ${formatEntryCount(filteredEntries.length)} по ${visibleDaysCount} дням.`
          }}
        </p>
      </AppCard>

      <AppCard v-if="canManageSchedule" class="span-12 schedule-cancelled">
        <div class="schedule-cancelled__header">
          <div>
            <h2 class="schedule-cancelled__title">Скрытые custom events</h2>
            <p class="muted">
              После перевода события в `Отменено` оно исчезает из agenda, но остаётся доступно здесь через edit route.
            </p>
          </div>

          <span class="pill">{{ formatEntryCount(cancelledEvents.length) }}</span>
        </div>

        <AppErrorState
          v-if="cancelledEventsErrorMessage"
          title="Не удалось загрузить отменённые события"
          :description="cancelledEventsErrorMessage"
        >
          <template #actions>
            <AppButton variant="secondary" size="sm" @click="cancelledEventsQuery.refetch()">Повторить</AppButton>
          </template>
        </AppErrorState>

        <div v-else-if="cancelledEventsQuery.isPending.value" class="schedule-cancelled__loading">
          Загружаем отменённые custom events, чтобы их можно было открыть повторно.
        </div>

        <AppEmptyState
          v-else-if="cancelledEvents.length === 0"
          title="Нет отменённых событий"
          description="Если кастомное событие перевести в `Отменено`, оно исчезнет из agenda, но останется доступно в этом списке."
        />

        <div v-else class="schedule-cancelled__list">
          <article v-for="event in cancelledEvents" :key="event.id" class="schedule-cancelled__item">
            <div class="schedule-cancelled__copy">
              <div class="schedule-cancelled__meta">
                <ScheduleEventStatusBadge :status="event.status" />
                <span class="pill">Скрыто из agenda</span>
              </div>

              <h3 class="schedule-cancelled__item-title">{{ event.title }}</h3>
              <p class="muted">{{ getCancelledEventMetaDescription(event.startsAt) }}</p>
              <p v-if="normalizeOptionalText(event.cancelledAt)" class="muted">
                Отменено {{ formatScheduleDateTime(normalizeOptionalText(event.cancelledAt)) }}
              </p>
              <p v-if="normalizeOptionalText(event.description)" class="schedule-cancelled__item-description">
                {{ normalizeOptionalText(event.description) }}
              </p>
            </div>

            <AppButton
              size="sm"
              variant="secondary"
              :to="{
                name: 'group-schedule-event-edit',
                params: {
                  groupId,
                  eventId: event.id,
                },
              }"
            >
              Открыть
            </AppButton>
          </article>
        </div>
      </AppCard>
    </div>

    <AppLoader v-if="scheduleQuery.isPending.value" label="Загружаем agenda-ленту группы" />

    <AppEmptyState v-else-if="groupedEntries.length === 0" :title="emptyStateTitle" :description="emptyStateDescription">
      <template #actions>
        <AppButton v-if="activeFilterCount === 0" variant="secondary" @click="resetFilters()">Включить все типы</AppButton>
        <AppButton
          v-else-if="canManageSchedule && scheduleEntries.length === 0"
          :to="{
            name: 'group-schedule-event-create',
            params: {
              groupId,
            },
          }"
        >
          Создать первое событие
        </AppButton>
      </template>
    </AppEmptyState>

    <div v-else class="schedule-days">
      <AppCard v-for="day in groupedEntries" :key="day.dateKey" class="schedule-day">
        <div class="schedule-day__header">
          <div>
            <h2 class="schedule-day__title">{{ day.label }}</h2>
            <p class="muted">{{ formatEntryCount(day.entries.length) }}</p>
          </div>

          <span class="pill">{{ formatEntryCount(day.entries.length) }}</span>
        </div>

        <div class="schedule-day__entries">
          <article
            v-for="entry in day.entries"
            :key="`${entry.sourceType}:${entry.sourceId}`"
            :class="['agenda-entry', `agenda-entry--${entry.sourceType.toLowerCase()}`]"
          >
            <div class="agenda-entry__header">
              <div class="agenda-entry__copy">
                <div class="agenda-entry__meta">
                  <span class="pill">{{ scheduleEntryTypeLabels[entry.sourceType] }}</span>
                  <span class="agenda-entry__time">{{ formatScheduleEntryTiming(entry) }}</span>
                </div>

                <h3 class="agenda-entry__title">{{ entry.title }}</h3>
                <p class="agenda-entry__description">{{ getEntryDescription(entry) }}</p>
              </div>

              <div v-if="getAgendaAction(entry)" class="agenda-entry__actions">
                <AppButton
                  size="sm"
                  :variant="getAgendaAction(entry)?.variant ?? 'secondary'"
                  :to="getAgendaAction(entry)?.to"
                >
                  {{ getAgendaAction(entry)?.label }}
                </AppButton>
              </div>
            </div>
          </article>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.schedule-summary,
.schedule-toolbar,
.schedule-cancelled,
.schedule-day {
  gap: 1rem;
}

.schedule-summary__header,
.schedule-toolbar__header,
.schedule-cancelled__header,
.schedule-day__header,
.agenda-entry__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.schedule-summary__title,
.schedule-toolbar__title,
.schedule-cancelled__title,
.schedule-day__title,
.agenda-entry__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.schedule-summary__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.schedule-metric {
  display: grid;
  gap: 0.28rem;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(31, 117, 156, 0.14);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.78);
}

.schedule-metric__value {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.schedule-metric__label {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.schedule-summary__types {
  display: grid;
  gap: 0.8rem;
  margin: 0;
}

.schedule-summary__types div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.schedule-summary__types div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.schedule-summary__types dt,
.schedule-summary__types dd {
  margin: 0;
}

.schedule-summary__types dd {
  font-weight: 800;
}

.schedule-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.schedule-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-panel);
  color: var(--color-text);
  font-weight: 700;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
}

.schedule-filter:hover {
  transform: translateY(-1px);
}

.schedule-filter--active {
  border-color: rgba(31, 117, 156, 0.28);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}

.schedule-filter__count {
  display: inline-grid;
  place-items: center;
  min-width: 1.8rem;
  min-height: 1.8rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: inherit;
  font-size: 0.84rem;
}

.schedule-days {
  display: grid;
  gap: 1rem;
}

.schedule-cancelled__loading {
  color: var(--color-muted);
}

.schedule-cancelled__list {
  display: grid;
  gap: 0.9rem;
}

.schedule-cancelled__item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(156, 71, 71, 0.18);
  border-radius: var(--radius-md);
  background: rgba(156, 71, 71, 0.05);
}

.schedule-cancelled__copy {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.schedule-cancelled__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.schedule-cancelled__item-title {
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.schedule-cancelled__item-description {
  margin: 0;
  color: var(--color-subtle);
}

.schedule-day__entries {
  display: grid;
  gap: 0.85rem;
}

.agenda-entry {
  padding: 1rem 1.05rem;
  border: 1px solid var(--color-border);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  background: var(--color-panel);
}

.agenda-entry--lesson {
  border-left-color: rgba(31, 117, 156, 0.48);
}

.agenda-entry--assignment_deadline {
  border-left-color: rgba(198, 151, 49, 0.5);
}

.agenda-entry--custom_event {
  border-left-color: rgba(58, 129, 89, 0.5);
}

.agenda-entry__copy {
  display: grid;
  gap: 0.55rem;
}

.agenda-entry__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.agenda-entry__time {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-subtle);
}

.agenda-entry__description {
  margin: 0;
  color: var(--color-subtle);
}

@media (max-width: 900px) {
  .schedule-summary__header,
  .schedule-toolbar__header,
  .schedule-cancelled__header,
  .schedule-day__header,
  .agenda-entry__header,
  .schedule-cancelled__item {
    flex-direction: column;
  }

  .schedule-summary__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
