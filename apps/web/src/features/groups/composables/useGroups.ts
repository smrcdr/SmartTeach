import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import {
  createJoinRequest,
  createGroup,
  getGroup,
  getGroupSettings,
  joinGroup,
  listGroups,
  listGroupSchedule,
  lookupGroupByCode,
  type CreateGroupPayload,
  type Group,
  type GroupJoinRequest,
  type GroupMember,
  type ListGroupScheduleQuery,
  type ListGroupsQuery,
} from '../api/groups.api'

type GroupListScope = 'joined' | 'visible'

const DEFAULT_LIST_QUERY = {}

export const groupQueryKeys = {
  all: ['groups'] as const,
  list: (scope: GroupListScope, query: Partial<ListGroupsQuery>) => ['groups', 'list', scope, query] as const,
  detail: (groupId: string) => ['groups', 'detail', groupId] as const,
  settings: (groupId: string) => ['groups', 'settings', groupId] as const,
  schedule: (groupId: string, query: Partial<ListGroupScheduleQuery>) => ['groups', 'schedule', groupId, query] as const,
}

export function useGroupsList(
  scope: GroupListScope,
  query: MaybeRefOrGetter<Partial<ListGroupsQuery>> = DEFAULT_LIST_QUERY,
  options: {
    enabled?: MaybeRefOrGetter<boolean>
  } = {},
) {
  const normalizedQuery = computed(() => normalizeListQuery(scope, toValue(query)))
  const enabled = computed(() => toValue(options.enabled) ?? true)

  return useQuery({
    queryKey: computed(() => groupQueryKeys.list(scope, normalizedQuery.value)),
    queryFn: () => listGroups(normalizedQuery.value),
    enabled,
  })
}

export function useGroup(groupId: MaybeRefOrGetter<string>, options: { enabled?: MaybeRefOrGetter<boolean> } = {}) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => groupQueryKeys.detail(resolvedGroupId.value)),
    queryFn: () => getGroup(resolvedGroupId.value),
    enabled,
  })
}

export function useGroupSettings(
  groupId: MaybeRefOrGetter<string>,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => groupQueryKeys.settings(resolvedGroupId.value)),
    queryFn: () => getGroupSettings(resolvedGroupId.value),
    enabled,
  })
}

export function useGroupSchedule(
  groupId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<ListGroupScheduleQuery>> = DEFAULT_LIST_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const normalizedQuery = computed(() => normalizeScheduleQuery(toValue(query)))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => groupQueryKeys.schedule(resolvedGroupId.value, normalizedQuery.value)),
    queryFn: () => listGroupSchedule(resolvedGroupId.value, normalizedQuery.value),
    enabled,
  })
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
    onSuccess: async (group: Group) => {
      await queryClient.invalidateQueries({
        queryKey: groupQueryKeys.all,
      })

      queryClient.setQueryData(groupQueryKeys.detail(group.id), group)
    },
  })
}

export function useJoinGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => joinGroup(groupId),
    onSuccess: async (_member: GroupMember) => {
      await queryClient.invalidateQueries({
        queryKey: groupQueryKeys.all,
      })
    },
  })
}

export function useCreateJoinRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => createJoinRequest(groupId),
    onSuccess: async (_request: GroupJoinRequest) => {
      await queryClient.invalidateQueries({
        queryKey: groupQueryKeys.all,
      })
    },
  })
}

export function useLookupGroupByCodeMutation() {
  return useMutation({
    mutationFn: (code: string) => lookupGroupByCode(code),
  })
}

function normalizeListQuery(scope: GroupListScope, query: Partial<ListGroupsQuery>) {
  const nextQuery = {
    ...query,
    joinedOnly: scope === 'joined' ? true : query.joinedOnly,
  }

  return Object.fromEntries(
    Object.entries(nextQuery).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListGroupsQuery>
}

function normalizeScheduleQuery(query: Partial<ListGroupScheduleQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListGroupScheduleQuery>
}
