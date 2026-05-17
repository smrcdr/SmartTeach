<script setup lang="ts">
import { Plus, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { listScheduleEvents, type ScheduleEvent } from '@/features/groups/api/groups.api'
import { useGroup } from '@/features/groups/composables/useGroup'
import { canManageGroup } from '@/features/groups/lib/group-permissions'
import { getScheduleEventStatusLabel } from '@/features/groups/lib/status-labels'
import ContentList from '@/features/groups/components/ContentList.vue'
import WorkspaceItem from '@/features/groups/components/WorkspaceItem.vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPageHeader from '@/shared/ui/AppPageHeader.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import StatusPill from '@/shared/ui/StatusPill.vue'
import { formatDateTime } from '@/shared/lib/date'

type ScheduleMode = 'WEEKLY' | 'SPECIAL'

const weekdayLabels = new Map([
  [1, 'Понедельник'],
  [2, 'Вторник'],
  [3, 'Среда'],
  [4, 'Четверг'],
  [5, 'Пятница'],
  [6, 'Суббота'],
  [7, 'Воскресенье']
])

const auth = useAuthStore()
const { group } = useGroup()
const events = ref<ScheduleEvent[]>([])
const activeMode = ref<ScheduleMode>('WEEKLY')
const activeWeekday = ref<number | null>(null)
const selectedEvent = ref<ScheduleEvent | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const canManage = computed(() => canManageGroup(group.value))
const groupId = computed(() => group.value?.id ?? '')
const weeklyEnabled = computed(() => group.value?.settings.scheduleWeeklyEnabled ?? true)
const specialEnabled = computed(() => group.value?.settings.scheduleSpecialEnabled ?? true)
const enabledModes = computed<ScheduleMode[]>(() => [
  ...(weeklyEnabled.value ? ['WEEKLY' as const] : []),
  ...(specialEnabled.value ? ['SPECIAL' as const] : [])
])
const shouldShowModeSwitch = computed(() => enabledModes.value.length > 1)
const createRoute = computed(() => ({
  name: 'group-schedule-event-create',
  params: { groupId: groupId.value },
  query: { eventType: activeMode.value }
}))
const visibleEvents = computed(() => events.value.filter((event) => event.eventType === activeMode.value))
const weeklyDays = computed(() => {
  const weekdays = new Set(
    visibleEvents.value
      .map((event) => event.weekday)
      .filter((weekday): weekday is number => typeof weekday === 'number')
  )

  return [...weekdays].sort((left, right) => left - right)
})
const weeklyEventsForDay = computed(() => {
  if (!activeWeekday.value) {
    return []
  }

  return visibleEvents.value
    .filter((event) => event.weekday === activeWeekday.value)
    .sort((left, right) => (left.startTime ?? '').localeCompare(right.startTime ?? ''))
})
const specialEvents = computed(() => visibleEvents.value)

function getEventMeta(event: ScheduleEvent) {
  if (event.eventType === 'WEEKLY') {
    return `${event.startTime ?? ''} - ${event.endTime ?? ''}`
  }

  return formatDateTime(event.startsAt)
}

function getEventDescription(event: ScheduleEvent) {
  return event.location ?? event.description ?? undefined
}

async function loadEvents() {
  if (!groupId.value || !auth.accessToken || enabledModes.value.length === 0) {
    events.value = []
    return
  }

  isLoading.value = true
  error.value = null
  try {
    events.value = await listScheduleEvents(groupId.value, auth.accessToken)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Не удалось загрузить расписание'
  } finally {
    isLoading.value = false
  }
}

watch([groupId, () => auth.accessToken], () => {
  void loadEvents()
}, { immediate: true })

watch(enabledModes, (modes) => {
  if (modes.length > 0 && !modes.includes(activeMode.value)) {
    activeMode.value = modes[0]!
  }
}, { immediate: true })

watch(weeklyDays, (days) => {
  if (activeMode.value !== 'WEEKLY') {
    return
  }

  if (!activeWeekday.value || !days.includes(activeWeekday.value)) {
    activeWeekday.value = days[0] ?? null
  }
}, { immediate: true })
</script>

<template>
  <main class="page">
    <AppPageHeader
      eyebrow="Календарь"
      title="Расписание"
      description="Еженедельные занятия и особые события группы."
      align="split"
    >
      <template v-if="canManage && enabledModes.length > 0" #actions>
        <RouterLink :to="createRoute">
          <AppButton><Plus :size="18" /> {{ activeMode === 'WEEKLY' ? 'Запись' : 'Событие' }}</AppButton>
        </RouterLink>
      </template>
    </AppPageHeader>

    <EmptyState
      v-if="enabledModes.length === 0"
      title="Расписание отключено"
      description="Администратор отключил еженедельные и особые события."
    />

    <div v-else>
      <div v-if="shouldShowModeSwitch" class="schedule-tabs" aria-label="Тип расписания">
        <button
          type="button"
          :class="['schedule-tab', activeMode === 'WEEKLY' && 'schedule-tab--active']"
          @click="activeMode = 'WEEKLY'"
        >
          Недельные
        </button>
        <button
          type="button"
          :class="['schedule-tab', activeMode === 'SPECIAL' && 'schedule-tab--active']"
          @click="activeMode = 'SPECIAL'"
        >
          Особые
        </button>
      </div>

      <ContentList v-if="activeMode === 'WEEKLY'" title="Недельное расписание">
        <div v-if="weeklyDays.length > 0" class="schedule-days">
          <button
            v-for="weekday in weeklyDays"
            :key="weekday"
            type="button"
            :class="['schedule-day', activeWeekday === weekday && 'schedule-day--active']"
            @click="activeWeekday = weekday"
          >
            {{ weekdayLabels.get(weekday) }}
          </button>
        </div>

        <WorkspaceItem
          v-for="event in weeklyEventsForDay"
          :key="event.id"
          :title="event.title"
          :description="getEventDescription(event)"
          :meta="getEventMeta(event)"
          @click="selectedEvent = event"
        >
          <template #aside>
            <StatusPill :label="getScheduleEventStatusLabel(event.status)" :tone="event.status === 'PLANNED' ? 'primary' : 'muted'" />
          </template>
        </WorkspaceItem>
        <EmptyState
          v-if="!isLoading && weeklyDays.length === 0"
          title="Дней пока нет"
          description="Администратор может добавить первый день через создание еженедельной записи."
        />
        <EmptyState v-if="error" title="Не удалось загрузить расписание" :description="error" />
      </ContentList>

      <ContentList v-else title="Особые события">
        <WorkspaceItem
          v-for="event in specialEvents"
          :key="event.id"
          :title="event.title"
          :description="getEventDescription(event)"
          :meta="getEventMeta(event)"
          @click="selectedEvent = event"
        >
          <template #aside>
            <StatusPill :label="getScheduleEventStatusLabel(event.status)" :tone="event.status === 'PLANNED' ? 'primary' : 'muted'" />
          </template>
        </WorkspaceItem>
        <EmptyState v-if="!isLoading && specialEvents.length === 0" title="Особых событий пока нет" />
        <EmptyState v-if="error" title="Не удалось загрузить расписание" :description="error" />
      </ContentList>
    </div>

    <div v-if="selectedEvent" class="event-dialog" role="presentation" @click.self="selectedEvent = null">
      <section class="event-dialog__panel" role="dialog" aria-modal="true">
        <header>
          <div>
            <p>{{ selectedEvent.eventType === 'WEEKLY' ? 'Недельное событие' : 'Особое событие' }}</p>
            <h2>{{ selectedEvent.title }}</h2>
          </div>
          <button type="button" aria-label="Закрыть" @click="selectedEvent = null"><X :size="20" /></button>
        </header>
        <dl>
          <div>
            <dt>Время</dt>
            <dd>{{ getEventMeta(selectedEvent) }}</dd>
          </div>
          <div v-if="selectedEvent.location">
            <dt>Место</dt>
            <dd>{{ selectedEvent.location }}</dd>
          </div>
        </dl>
        <p>{{ selectedEvent.description || 'Описание события пока не заполнено.' }}</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.schedule-tabs,
.schedule-days {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 22px;
}

.schedule-tab,
.schedule-day {
  background: var(--color-surface-low);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  font-weight: 800;
  min-height: 40px;
  padding: 0 14px;
}

.schedule-tab--active,
.schedule-day--active {
  background: var(--color-primary);
  color: #fff;
}

.event-dialog {
  align-items: center;
  background: rgb(17 24 39 / 52%);
  display: grid;
  inset: 0;
  justify-items: center;
  padding: 24px;
  position: fixed;
  z-index: 40;
}

.event-dialog__panel {
  background: var(--color-surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-ambient);
  display: grid;
  gap: 18px;
  max-width: 560px;
  padding: 28px;
  width: min(100%, 560px);
}

.event-dialog__panel header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.event-dialog__panel h2,
.event-dialog__panel p,
.event-dialog__panel dl,
.event-dialog__panel dd {
  margin: 0;
}

.event-dialog__panel header p {
  color: var(--color-primary);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-dialog__panel h2 {
  color: var(--color-text);
  line-height: 1.16;
}

.event-dialog__panel header button {
  align-items: center;
  background: var(--color-surface-low);
  border: 0;
  border-radius: var(--radius-xs);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.event-dialog__panel dl {
  display: grid;
  gap: 10px;
}

.event-dialog__panel dt {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.event-dialog__panel dd,
.event-dialog__panel > p {
  color: var(--color-text-muted);
  line-height: 1.6;
}
</style>
