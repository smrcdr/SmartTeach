import type { CreateScheduleEventPayload, ScheduleEvent, UpdateScheduleEventPayload } from '../api/schedule.api'
import { normalizeOptionalText } from './schedule.ui'

export type ScheduleEventEditorSubmission = {
  title: string
  description: string
  startsAt: string
  endsAt: string
  location: string
  status: ScheduleEvent['status']
}

export function isoToLocalDateTimeValue(value: unknown) {
  const normalizedValue = normalizeOptionalText(value)

  if (!normalizedValue) {
    return ''
  }

  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function buildCreateScheduleEventPayload(submission: ScheduleEventEditorSubmission): CreateScheduleEventPayload {
  return {
    title: submission.title.trim(),
    startsAt: requireLocalDateTimeValue(submission.startsAt),
    endsAt: requireLocalDateTimeValue(submission.endsAt),
    ...buildOptionalScheduleFields(submission),
  }
}

export function buildUpdateScheduleEventPayload(submission: ScheduleEventEditorSubmission): UpdateScheduleEventPayload {
  return {
    title: submission.title.trim(),
    startsAt: requireLocalDateTimeValue(submission.startsAt),
    endsAt: requireLocalDateTimeValue(submission.endsAt),
    status: submission.status,
    ...buildOptionalScheduleFields(submission),
  }
}

export function getScheduleEventDateValidationMessage(startsAt: string, endsAt: string) {
  const normalizedStart = normalizeOptionalText(startsAt)
  const normalizedEnd = normalizeOptionalText(endsAt)

  if (!normalizedStart) {
    return 'Укажите дату и время начала.'
  }

  if (!normalizedEnd) {
    return 'Укажите дату и время окончания.'
  }

  const startDate = new Date(normalizedStart)
  const endDate = new Date(normalizedEnd)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Проверьте формат даты и времени.'
  }

  if (startDate.getTime() > endDate.getTime()) {
    return 'Дата окончания не может быть раньше даты начала.'
  }

  return ''
}

function buildOptionalScheduleFields(submission: ScheduleEventEditorSubmission) {
  const normalizedDescription = normalizeOptionalText(submission.description)
  const normalizedLocation = normalizeOptionalText(submission.location)

  return {
    ...(normalizedDescription
      ? {
          description: normalizedDescription,
        }
      : {}),
    ...(normalizedLocation
      ? {
          location: normalizedLocation,
        }
      : {}),
  }
}

function requireLocalDateTimeValue(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error('Schedule event requires a valid datetime')
  }

  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Schedule event requires a valid datetime')
  }

  return date.toISOString()
}
