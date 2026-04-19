import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

type RawScheduleEvent = components['schemas']['ScheduleEvent']
type ErrorResponse = components['schemas']['ErrorResponse']
type CreateScheduleEventRequestBody =
  paths['/groups/{groupId}/schedule/events']['post']['requestBody']['content']['application/json']
type UpdateScheduleEventRequestBody =
  paths['/groups/{groupId}/schedule/events/{eventId}']['patch']['requestBody']['content']['application/json']

export type ScheduleEvent = Omit<RawScheduleEvent, 'description' | 'location' | 'cancelledAt'> & {
  description: string | null
  location: string | null
  cancelledAt: string | null
}
export type ScheduleEventStatus = ScheduleEvent['status']
export type ListScheduleEventsQuery = NonNullable<
  paths['/groups/{groupId}/schedule/events']['get']['parameters']['query']
>
export type CreateScheduleEventPayload = components['schemas']['CreateScheduleEventRequest']
export type UpdateScheduleEventPayload = components['schemas']['UpdateScheduleEventRequest']

export class ScheduleApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'ScheduleApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function listScheduleEvents(groupId: string, query: Partial<ListScheduleEventsQuery> = {}) {
  const normalizedQuery = normalizeScheduleEventsQuery(query)
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/schedule/events', {
    params: {
      path: {
        groupId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data.map((event) => normalizeScheduleEvent(event as RawScheduleEvent))
  }

  throw new ScheduleApiError(error, response.status, 'Не удалось загрузить кастомные события группы')
}

export async function getScheduleEvent(groupId: string, eventId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/schedule/events/{eventId}', {
    params: {
      path: {
        groupId,
        eventId,
      },
    },
  })

  if (data) {
    return normalizeScheduleEvent(data as RawScheduleEvent)
  }

  throw new ScheduleApiError(error, response.status, 'Не удалось загрузить кастомное событие')
}

export async function createScheduleEvent(groupId: string, payload: CreateScheduleEventPayload) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/schedule/events', {
    params: {
      path: {
        groupId,
      },
    },
    body: payload as CreateScheduleEventRequestBody,
  })

  if (data) {
    return normalizeScheduleEvent(data as RawScheduleEvent)
  }

  throw new ScheduleApiError(error, response.status, 'Не удалось создать кастомное событие')
}

export async function updateScheduleEvent(groupId: string, eventId: string, payload: UpdateScheduleEventPayload) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}/schedule/events/{eventId}', {
    params: {
      path: {
        groupId,
        eventId,
      },
    },
    body: payload as UpdateScheduleEventRequestBody,
  })

  if (data) {
    return normalizeScheduleEvent(data as RawScheduleEvent)
  }

  throw new ScheduleApiError(error, response.status, 'Не удалось обновить кастомное событие')
}

export async function deleteScheduleEvent(groupId: string, eventId: string) {
  const { error, response } = await apiClient.DELETE('/groups/{groupId}/schedule/events/{eventId}', {
    params: {
      path: {
        groupId,
        eventId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new ScheduleApiError(error, response.status, 'Не удалось удалить кастомное событие')
}

export function getScheduleErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ScheduleApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function normalizeScheduleEventsQuery(query: Partial<ListScheduleEventsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListScheduleEventsQuery>
}

function normalizeScheduleEvent(event: RawScheduleEvent): ScheduleEvent {
  return {
    ...event,
    description: normalizeNullableString(event.description),
    location: normalizeNullableString(event.location),
    cancelledAt: normalizeNullableString(event.cancelledAt),
  }
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  return normalizedValue.length > 0 ? normalizedValue : null
}
