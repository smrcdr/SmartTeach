<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { ScheduleEvent } from '../../features/schedule/api/schedule.api'
import { getScheduleErrorMessage } from '../../features/schedule/api/schedule.api'
import ScheduleEventForm from '../../features/schedule/components/ScheduleEventForm.vue'
import {
  useCreateScheduleEventMutation,
  useUpdateScheduleEventMutation,
} from '../../features/schedule/composables/useSchedule'
import {
  buildCreateScheduleEventPayload,
  type ScheduleEventEditorSubmission,
} from '../../features/schedule/lib/schedule-form'
import { useGroupWorkspace } from '../../features/groups/composables/useGroupWorkspace'
import AppLoader from '../../shared/ui/AppLoader.vue'

const route = useRoute()
const router = useRouter()

const groupId = computed(() => String(route.params.groupId ?? ''))
const workspace = useGroupWorkspace(groupId)
const createScheduleEventMutation = useCreateScheduleEventMutation(groupId)
const updateScheduleEventMutation = useUpdateScheduleEventMutation(groupId)
const submitError = ref('')

const isScheduleModuleUnavailable = computed(
  () => Boolean(workspace.settings.value) && !workspace.settings.value?.scheduleEnabled,
)
const isBlocked = computed(
  () => !workspace.canManageGroup.value || workspace.isReadOnly.value || isScheduleModuleUnavailable.value,
)
const isBusy = computed(
  () => createScheduleEventMutation.isPending.value || updateScheduleEventMutation.isPending.value,
)

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

  let createdEvent: ScheduleEvent | null = null

  try {
    createdEvent = await createScheduleEventMutation.mutateAsync(buildCreateScheduleEventPayload(submission))

    if (submission.status === 'CANCELLED') {
      await updateScheduleEventMutation.mutateAsync({
        eventId: createdEvent.id,
        payload: {
          status: 'CANCELLED',
        },
      })

      await router.push({
        name: 'group-schedule-event-edit',
        params: {
          groupId: groupId.value,
          eventId: createdEvent.id,
        },
      })

      return
    }

    await router.push({
      name: 'group-schedule',
      params: {
        groupId: groupId.value,
      },
    })
  } catch (error) {
    if (createdEvent) {
      await router.push({
        name: 'group-schedule-event-edit',
        params: {
          groupId: groupId.value,
          eventId: createdEvent.id,
        },
        query: {
          statusSync: 'unconfirmed-cancel',
        },
      })

      return
    }

    submitError.value = getScheduleErrorMessage(error, 'Не удалось создать кастомное событие')
  }
}
</script>

<template>
  <AppLoader
    v-if="workspace.isWorkspacePending.value || isBlocked"
    label="Проверяем права на создание события и готовим форму"
  />

  <div v-else class="page-shell">
    <header class="page-header">
      <span class="page-eyebrow">Рабочее пространство / Расписание / Создание</span>
      <h1 class="page-title">Новое пользовательское событие добавляется в ленту на отдельной странице.</h1>
      <p class="page-lead">
        Здесь управляющая роль создаёт собственный слот с названием, временем, локацией и статусом. После сохранения
        запланированное событие возвращается в общую ленту, а отменённая запись остаётся доступной через страницу редактирования.
      </p>
    </header>

    <ScheduleEventForm
      mode="create"
      :is-busy="isBusy"
      :submit-error="submitError"
      :cancel-to="{
        name: 'group-schedule',
        params: {
          groupId,
        },
      }"
      @submit="handleSubmit"
    />
  </div>
</template>
