import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import {
  decideGroupJoinRequest,
  createJoinRequest,
  createGroup,
  deleteGroup,
  getGroup,
  getGroupSettings,
  joinGroup,
  leaveGroup,
  listGroupJoinRequests,
  listGroupMembers,
  listGroups,
  listGroupSchedule,
  lookupGroupByCode,
  removeGroupMember,
  updateGroup,
  updateGroupMemberRole,
  updateGroupSettings,
  type CreateGroupPayload,
  type Group,
  type GroupJoinRequest,
  type GroupMember,
  type GroupSettings,
  type JoinRequestDecisionPayload,
  type ListGroupJoinRequestsQuery,
  type ListGroupScheduleQuery,
  type ListGroupsQuery,
  type UpdateGroupPayload,
  type UpdateGroupSettingsPayload,
} from '../api/groups.api'

type GroupListScope = 'joined' | 'visible'

const DEFAULT_LIST_QUERY = {}

export const groupQueryKeys = {
  all: ['groups'] as const,
  list: (scope: GroupListScope, query: Partial<ListGroupsQuery>) => ['groups', 'list', scope, query] as const,
  detail: (groupId: string) => ['groups', 'detail', groupId] as const,
  settings: (groupId: string) => ['groups', 'settings', groupId] as const,
  members: (groupId: string) => ['groups', 'members', groupId] as const,
  joinRequests: (groupId: string, query: Partial<ListGroupJoinRequestsQuery>) =>
    ['groups', 'join-requests', groupId, query] as const,
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

export function useGroupMembers(
  groupId: MaybeRefOrGetter<string>,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => groupQueryKeys.members(resolvedGroupId.value)),
    queryFn: () => listGroupMembers(resolvedGroupId.value),
    enabled,
  })
}

export function useGroupJoinRequests(
  groupId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<ListGroupJoinRequestsQuery>> = DEFAULT_LIST_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const normalizedQuery = computed(() => normalizeJoinRequestsQuery(toValue(query)))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => groupQueryKeys.joinRequests(resolvedGroupId.value, normalizedQuery.value)),
    queryFn: () => listGroupJoinRequests(resolvedGroupId.value, normalizedQuery.value),
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

export function useUpdateGroupMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateGroupPayload) => updateGroup(resolvedGroupId.value, payload),
    onSuccess: async (group: Group) => {
      queryClient.setQueryData(groupQueryKeys.detail(group.id), group)
      queryClient.setQueryData(groupQueryKeys.settings(group.id), group.settings)

      await invalidateGroupQueries(queryClient)
    },
  })
}

export function useJoinGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => joinGroup(groupId),
    onSuccess: async (member: GroupMember, groupId: string) => {
      queryClient.setQueryData<Group | undefined>(groupQueryKeys.detail(groupId), (currentGroup) => {
        if (!currentGroup) {
          return currentGroup
        }

        return {
          ...currentGroup,
          membersCount: currentGroup.viewerMembershipRole ? currentGroup.membersCount : currentGroup.membersCount + 1,
          viewerMembershipRole: member.role,
          viewerJoinRequestStatus: null,
        }
      })

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

export function useUpdateGroupSettingsMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateGroupSettingsPayload) => updateGroupSettings(resolvedGroupId.value, payload),
    onSuccess: async (settings: GroupSettings) => {
      queryClient.setQueryData(groupQueryKeys.settings(resolvedGroupId.value), settings)
      queryClient.setQueryData<Group | undefined>(groupQueryKeys.detail(resolvedGroupId.value), (currentGroup) => {
        if (!currentGroup) {
          return currentGroup
        }

        return {
          ...currentGroup,
          settings,
        }
      })

      await invalidateGroupQueries(queryClient)
    },
  })
}

export function useUpdateGroupMemberRoleMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: GroupMember['role'] }) =>
      updateGroupMemberRole(resolvedGroupId.value, userId, { role }),
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient)
    },
  })
}

export function useRemoveGroupMemberMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => removeGroupMember(resolvedGroupId.value, userId),
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient)
    },
  })
}

export function useDecideJoinRequestMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, decision }: { requestId: string; decision: JoinRequestDecisionPayload['decision'] }) =>
      decideGroupJoinRequest(resolvedGroupId.value, requestId, { decision }),
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient)
    },
  })
}

export function useLeaveGroupMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveGroup(resolvedGroupId.value),
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient)
    },
  })
}

export function useDeleteGroupMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteGroup(resolvedGroupId.value),
    onSuccess: async () => {
      await invalidateGroupQueries(queryClient)
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

function normalizeJoinRequestsQuery(query: Partial<ListGroupJoinRequestsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<ListGroupJoinRequestsQuery>
}

async function invalidateGroupQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({
    queryKey: groupQueryKeys.all,
  })
}
