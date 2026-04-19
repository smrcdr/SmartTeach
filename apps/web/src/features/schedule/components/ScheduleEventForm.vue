<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import type { ScheduleEvent } from '../api/schedule.api'
import {
  buildCreateScheduleEventPayload,
  getScheduleEventDateValidationMessage,
  isoToLocalDateTimeValue,
  type ScheduleEventEditorSubmission,
} from '../lib/schedule-form'
import { normalizeOptionalText, scheduleEventStatusLabels } from '../lib/schedule.ui'
import ScheduleEventStatusBadge from './ScheduleEventStatusBadge.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppCard from '../../../shared/ui/AppCard.vue'
import AppInput from '../../../shared/ui/AppInput.vue'
import AppSelect from '../../../shared/ui/AppSelect.vue'
import AppTextarea from '../../../shared/ui/AppTextarea.vue'

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    event?: ScheduleEvent | null
    isBusy?: boolean
    submitError?: string
    cancelTo?: RouteLocationRaw
    disabled?: boolean
  }>(),
  {
    event: null,
    isBusy: false,
    submitError: '',
    cancelTo: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  submit: [payload: ScheduleEventEditorSubmission]
}>()

const title = ref('')
const description = ref('')
const startsAt = ref('')
const endsAt = ref('')
const location = ref('')
const status = ref<ScheduleEvent['status']>('PLANNED')
const titleError = ref('')
const dateError = ref('')
const locationError = ref('')

const sectionLead = computed(() =>
  props.mode === 'create'
    ? 'Событие создаётся отдельным flow: здесь нет декоративного календаря, только явные поля и operational контекст.'
    : 'Редактирование оставляет полный контроль над названием, временным слотом, локацией и статусом записи.',
)
const statusHint = computed(() =>
  status.value === 'CANCELLED'
    ? 'Отменённые события не попадают в agenda-ленту группы, но остаются доступны по edit route.'
    : 'Статус управляется явно: planned-поток остаётся видимым в общем расписании.',
)
const statusOptions = computed(() =>
  Object.entries(scheduleEventStatusLabels).map(([value, label]) => ({
    value,
    label,
  })),
)

watch(
  () => props.event?.id ?? props.mode,
  () => {
    title.value = props.event?.title ?? ''
    description.value = normalizeOptionalText(props.event?.description)
    startsAt.value = isoToLocalDateTimeValue(props.event?.startsAt)
    endsAt.value = isoToLocalDateTimeValue(props.event?.endsAt)
    location.value = normalizeOptionalText(props.event?.location)
    status.value = props.event?.status ?? 'PLANNED'
    titleError.value = ''
    dateError.value = ''
    locationError.value = ''
  },
  {
    immediate: true,
  },
)

function submit() {
  if (props.disabled || props.isBusy) {
    return
  }

  titleError.value = ''
  dateError.value = ''
  locationError.value = ''

  const normalizedTitle = title.value.trim()
  const normalizedLocation = location.value.trim()

  if (normalizedTitle.length < 2) {
    titleError.value = 'Название события должно быть не короче 2 символов.'
  }

  if (normalizedTitle.length > 200) {
    titleError.value = 'Название события должно быть не длиннее 200 символов.'
  }

  if (normalizedLocation.length > 255) {
    locationError.value = 'Локация должна быть не длиннее 255 символов.'
  }

  dateError.value = getScheduleEventDateValidationMessage(startsAt.value, endsAt.value)

  if (titleError.value || locationError.value || dateError.value) {
    return
  }

  try {
    buildCreateScheduleEventPayload({
      title: normalizedTitle,
      description: description.value,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      location: location.value,
      status: status.value,
    })
  } catch {
    dateError.value = 'Проверьте формат даты и времени.'
    return
  }

  emit('submit', {
    title: normalizedTitle,
    description: description.value,
    startsAt: startsAt.value,
    endsAt: endsAt.value,
    location: location.value,
    status: status.value,
  })
}
</script>

<template>
  <div class="section-grid">
    <AppCard class="span-8 schedule-event-form__card">
      <div class="schedule-event-form__header">
        <div>
          <h2 class="schedule-event-form__title">
            {{ mode === 'create' ? 'Новое кастомное событие' : 'Редактирование кастомного события' }}
          </h2>
          <p class="muted">{{ sectionLead }}</p>
        </div>

        <ScheduleEventStatusBadge v-if="event" :status="event.status" />
      </div>

      <div class="form-grid">
        <AppInput
          v-model="title"
          class="span-full"
          label="Название"
          placeholder="Например, Разбор контрольной перед дедлайном"
          :error="titleError"
          :disabled="disabled || isBusy"
        />

        <AppInput
          v-model="startsAt"
          label="Начало"
          type="datetime-local"
          :error="dateError"
          :disabled="disabled || isBusy"
        />

        <AppInput
          v-model="endsAt"
          label="Окончание"
          type="datetime-local"
          :error="dateError"
          :disabled="disabled || isBusy"
        />

        <AppInput
          v-model="location"
          label="Локация"
          placeholder="Zoom / аудитория / ссылка на комнату"
          hint="Необязательное поле. Подходит для очной встречи или ссылки на созвон."
          :error="locationError"
          :disabled="disabled || isBusy"
        />

        <AppSelect
          v-model="status"
          label="Статус"
          :options="statusOptions"
          :hint="statusHint"
          :disabled="disabled || isBusy"
        />

        <AppTextarea
          v-model="description"
          class="span-full"
          label="Описание"
          placeholder="Краткий контекст события, подготовка, состав участников или operational заметки."
          hint="Описание можно оставить пустым, если событие нужно только как временной слот."
          :disabled="disabled || isBusy"
        />
      </div>
    </AppCard>

    <AppCard tone="accent" class="span-4 schedule-event-form__card">
      <div class="schedule-event-form__header">
        <div>
          <h2 class="schedule-event-form__title">Действия формы</h2>
          <p class="muted">Событие сохраняется одним явным действием, а статус остаётся самостоятельным полем.</p>
        </div>
      </div>

      <div class="schedule-event-form__actions">
        <AppButton block :disabled="disabled || isBusy" @click="submit()">
          {{ mode === 'create' ? 'Создать событие' : 'Сохранить изменения' }}
        </AppButton>
        <AppButton v-if="cancelTo" :to="cancelTo" variant="secondary" block>
          Назад к расписанию
        </AppButton>
      </div>

      <p v-if="submitError" class="schedule-event-form__submit-error">{{ submitError }}</p>

      <ul class="list-copy">
        <li>Agenda-лента смешивает кастомные события с уроками и дедлайнами в одном дневном потоке.</li>
        <li>Архивная группа остаётся read-only, поэтому форма показывается только для writable manager-ролей.</li>
        <li>Если сохранить статус `Отменено`, событие останется доступным по edit route, но исчезнет из agenda.</li>
      </ul>
    </AppCard>
  </div>
</template>

<style scoped>
.schedule-event-form__card {
  gap: 1.2rem;
}

.schedule-event-form__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.schedule-event-form__title {
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.schedule-event-form__actions {
  display: grid;
  gap: 0.75rem;
}

.schedule-event-form__submit-error {
  margin: 0;
  color: var(--color-danger);
  font-weight: 700;
}

@media (max-width: 900px) {
  .schedule-event-form__header {
    flex-direction: column;
  }
}
</style>
