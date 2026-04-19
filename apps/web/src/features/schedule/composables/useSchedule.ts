import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import {
  createScheduleEvent,
  deleteScheduleEvent,
  getScheduleEvent,
  listScheduleEvents,
  updateScheduleEvent,
  type CreateScheduleEventPayload,
  type ListScheduleEventsQuery,
  type ScheduleEvent,
  type UpdateScheduleEventPayload,
} from '../api/schedule.api'

const DEFAULT_SCHEDULE_EVENTS_QUERY = {}

export const scheduleQueryKeys = {
  all: ['schedule'] as const,
  events: (groupId: string) => ['schedule', 'events', groupId] as const,
  eventList: (groupId: string, query: Partial<ListScheduleEventsQuery>) => ['schedule', 'events', groupId, query] as const,
  eventDetail: (groupId: string, eventId: string) => ['schedule', 'event', groupId, eventId] as const,
}

export function useScheduleEventsList(
  groupId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<ListScheduleEventsQuery>> = DEFAULT_SCHEDULE_EVENTS_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const normalizedQuery = computed(() => normalizeScheduleEventsQuery(toValue(query)))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => scheduleQueryKeys.eventList(resolvedGroupId.value, normalizedQuery.value)),
    queryFn: () => listScheduleEvents(resolvedGroupId.value, normalizedQuery.value),
    enabled,
  })
}

export function useScheduleEvent(
  groupId: MaybeRefOrGetter<string>,
  eventId: MaybeRefOrGetter<string>,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedEventId = computed(() => toValue(eventId))
  const enabled = computed(
    () => Boolean(resolvedGroupId.value) && Boolean(resolvedEventId.value) && (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() => scheduleQueryKeys.eventDetail(resolvedGroupId.value, resolvedEventId.value)),
    queryFn: () => getScheduleEvent(resolvedGroupId.value, resolvedEventId.value),
    enabled,
  })
}

export function useCreateScheduleEventMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateScheduleEventPayload) => createScheduleEvent(resolvedGroupId.value, payload),
    onSuccess: async (event: ScheduleEvent) => {
      queryClient.setQueryData(scheduleQueryKeys.eventDetail(resolvedGroupId.value, event.id), event)
      await invalidateScheduleQueries(queryClient, resolvedGroupId.value)
    },
  })
}

export function useUpdateScheduleEventMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateScheduleEventPayload }) =>
      updateScheduleEvent(resolvedGroupId.value, eventId, payload),
    onSuccess: async (event: ScheduleEvent) => {
      queryClient.setQueryData(scheduleQueryKeys.eventDetail(resolvedGroupId.value, event.id), event)
      await invalidateScheduleQueries(queryClient, resolvedGroupId.value)
    },
  })
}

export function useDeleteScheduleEventMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => deleteScheduleEvent(resolvedGroupId.value, eventId),
    onSuccess: async (_data, eventId) => {
      queryClient.removeQueries({
        queryKey: scheduleQueryKeys.eventDetail(resolvedGroupId.value, eventId),
      })

      await invalidateScheduleQueries(queryClient, resolvedGroupId.value)
    },
  })
}

function normalizeScheduleEventsQuery(query: Partial<ListScheduleEventsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListScheduleEventsQuery>
}

async function invalidateScheduleQueries(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.events(groupId),
    }),
    queryClient.invalidateQueries({
      queryKey: ['groups', 'schedule', groupId],
    }),
  ])
}
