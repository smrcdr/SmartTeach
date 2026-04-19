<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import { getScheduleErrorMessage } from '../../features/schedule/api/schedule.api'
import ScheduleEventForm from '../../features/schedule/components/ScheduleEventForm.vue'
import ScheduleEventStatusBadge from '../../features/schedule/components/ScheduleEventStatusBadge.vue'
import {
  useDeleteScheduleEventMutation,
  useScheduleEvent,
  useUpdateScheduleEventMutation,
} from '../../features/schedule/composables/useSchedule'
import {
  buildUpdateScheduleEventPayload,
  type ScheduleEventEditorSubmission,
} from '../../features/schedule/lib/schedule-form'
import { formatScheduleDateTime, normalizeOptionalText } from '../../features/schedule/lib/schedule.ui'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCard from '../../shared/ui/AppCard.vue'
import AppErrorState from '../../shared/ui/AppErrorState.vue'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const eventId = computed(() => String(route.params.eventId ?? ''))
const workspace = useGroupWorkspace(groupId)
const updateScheduleEventMutation = useUpdateScheduleEventMutation(groupId)
const deleteScheduleEventMutation = useDeleteScheduleEventMutation(groupId)
const submitError = ref('')
const deleteError = ref('')

const isScheduleModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.scheduleEnabled,
)
const isBlocked = computed(
  () => !workspace.canManageGroup.value || workspace.isReadOnly.value || isScheduleModuleUnavailable.value,
)
const scheduleEventQuery = useScheduleEvent(groupId, eventId, {
  enabled: computed(
    () => workspace.isMember.value && Boolean(workspace.settings.value) && !isScheduleModuleUnavailable.value,
  ),
})

const event = computed(() => scheduleEventQuery.data.value ?? null)
const isBusy = computed(
  () =>
    (scheduleEventQuery.isPending.value && !event.value) ||
    updateScheduleEventMutation.isPending.value ||
    deleteScheduleEventMutation.isPending.value,
)
const eventErrorMessage = computed(() => {
  const error = scheduleEventQuery.error.value

  return error ? getScheduleErrorMessage(error, 'Не удалось открыть кастомное событие') : ''
})

watchEffect(() => {
  if (!workspace.isWorkspacePending.value && isBlocked.value) {
    void router.replace({
      name: isScheduleModuleUnavailable.value ? 'group-overview' : 'group-schedule',
      params: {
        groupId: groupId.value,
      },
    })
  }
})

async function handleSubmit(submission: ScheduleEventEditorSubmission) {
  submitError.value = ''

  try {
    const updatedEvent = await updateScheduleEventMutation.mutateAsync({
      eventId: eventId.value,
      payload: buildUpdateScheduleEventPayload(submission),
    })

    if (updatedEvent.status === 'CANCELLED') {
      await scheduleEventQuery.refetch()
      return
    }

    await router.push({
      name: 'group-schedule',
      params: {
        groupId: groupId.value,
      },
    })
  } catch (error) {
    submitError.value = getScheduleErrorMessage(error, 'Не удалось обновить кастомное событие')
  }
}

async function handleDelete() {
  if (!event.value || deleteScheduleEventMutation.isPending.value) {
    return
  }

  const shouldDelete = window.confirm(`Удалить событие "${event.value.title}"?`)

  if (!shouldDelete) {
    return
  }

  deleteError.value = ''

  try {
    await deleteScheduleEventMutation.mutateAsync(event.value.id)

    await router.push({
      name: 'group-schedule',
      params: {
        groupId: groupId.value,
      },
    })
  } catch (error) {
    deleteError.value = getScheduleErrorMessage(error, 'Не удалось удалить кастомное событие')
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || isBlocked || isBusy"
    label="Проверяем права на редактирование и загружаем кастомное событие"
  />

  <AppErrorState
    v-else-if="eventErrorMessage"
    title="Не удалось открыть событие"
    :description="eventErrorMessage"
  >
    <template #actions>
      <AppButton
        variant="secondary"
        :to="{
          name: 'group-schedule',
          params: {
            groupId,
          },
        }"
      >
        Назад к расписанию
      </AppButton>
    </template>
  </AppErrorState>

  <div v-else-if="event" class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Workspace / Schedule / Edit</span>
      <h1 class="page-title">Редактирование кастомного события вынесено в отдельный manager-only flow.</h1>
      <p class="page-lead">
        Здесь можно менять временной слот, описание, локацию и статус записи. Если событие перевести в `Отменено`, оно
        исчезнет из agenda-ленты, но останется доступным по этому route.
      </p>
    </header>

    <div v-if="event.status === 'CANCELLED'" class="panel-note">
      Событие находится в статусе `Отменено`, поэтому в основной agenda-ленте его больше не видно. Здесь запись всё
      ещё можно вернуть в `Запланировано`, обновить детали или удалить.
    </div>

    <ScheduleEventForm
      mode="edit"
      :event="event"
      :is-busy="updateScheduleEventMutation.isPending.value || deleteScheduleEventMutation.isPending.value"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-schedule',
        params: {
          groupId,
        },
      }"
      @submit="handleSubmit"
    />

    <div class="section-grid">
      <AppCard class="span-8 schedule-event-meta">
        <div class="schedule-event-meta__header">
          <div>
            <h2 class="schedule-event-meta__title">Текущее состояние записи</h2>
            <p class="muted">Проверьте метаданные после сохранения: статус, слот, локацию и временные отметки.</p>
          </div>

          <ScheduleEventStatusBadge :status="event.status" />
        </div>

        <dl class="schedule-event-meta__facts">
          <div>
            <dt>Старт</dt>
            <dd>{{ formatScheduleDateTime(event.startsAt) }}</dd>
          </div>
          <div>
            <dt>Окончание</dt>
            <dd>{{ formatScheduleDateTime(event.endsAt) }}</dd>
          </div>
          <div>
            <dt>Локация</dt>
            <dd>{{ normalizeOptionalText(event.location) || 'Не указана' }}</dd>
          </div>
          <div>
            <dt>Описание</dt>
            <dd>{{ normalizeOptionalText(event.description) || 'Пустое описание' }}</dd>
          </div>
          <div>
            <dt>Создано</dt>
            <dd>{{ formatScheduleDateTime(event.createdAt) }}</dd>
          </div>
          <div>
            <dt>Обновлено</dt>
            <dd>{{ formatScheduleDateTime(event.updatedAt) }}</dd>
          </div>
          <div v-if="normalizeOptionalText(event.cancelledAt)">
            <dt>Отменено</dt>
            <dd>{{ formatScheduleDateTime(normalizeOptionalText(event.cancelledAt)) }}</dd>
          </div>
        </dl>
      </AppCard>

      <AppCard tone="accent" class="span-4 schedule-event-danger">
        <div class="schedule-event-meta__header">
          <div>
            <h2 class="schedule-event-meta__title">Удаление</h2>
            <p class="muted">Удаление убирает запись из группы полностью, без промежуточного архивного статуса.</p>
          </div>
        </div>

        <AppButton
          variant="ghost"
          block
          :disabled="deleteScheduleEventMutation.isPending.value"
          @click="handleDelete()"
        >
          Удалить событие
        </AppButton>

        <p v-if="deleteError" class="schedule-event-danger__error">{{ deleteError }}</p>

        <ul class="list-copy">
          <li>Для временного скрытия из agenda безопаснее оставить запись и сменить статус на `Отменено`.</li>
          <li>Delete нужен только когда слот создан ошибочно и не должен оставаться в истории workspace.</li>
        </ul>
      </AppCard>
    </div>
  </div>
</template>

<style scoped>
.schedule-event-meta,
.schedule-event-danger {
  gap: 1rem;
}

.schedule-event-meta__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.schedule-event-meta__title {
  font-size: 1.08rem;
  letter-spacing: -0.02em;
}

.schedule-event-meta__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
  margin: 0;
}

.schedule-event-meta__facts div {
  display: grid;
  gap: 0.3rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.6);
}

.schedule-event-meta__facts dt,
.schedule-event-meta__facts dd {
  margin: 0;
}

.schedule-event-meta__facts dt {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.schedule-event-danger__error {
  margin: 0;
  color: var(--color-danger);
  font-weight: 700;
}

@media (max-width: 900px) {
  .schedule-event-meta__header {
    flex-direction: column;
  }

  .schedule-event-meta__facts {
    grid-template-columns: 1fr;
  }
}
</style>
