import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import {
  createAssignment,
  createSubmission,
  getAssignment,
  getSubmission,
  listAssignments,
  listSubmissions,
  updateAssignment,
  updateSubmission,
  type Assignment,
  type CreateAssignmentPayload,
  type CreateSubmissionPayload,
  type ListAssignmentsQuery,
  type ListSubmissionsQuery,
  type Submission,
  type UpdateAssignmentPayload,
  type UpdateSubmissionPayload,
} from '../api/assignments.api'

const DEFAULT_QUERY = {}

export const assignmentQueryKeys = {
  all: ['assignments'] as const,
  group: (groupId: string) => ['assignments', 'group', groupId] as const,
  list: (groupId: string, query: Partial<ListAssignmentsQuery>) =>
    ['assignments', 'group', groupId, 'list', query] as const,
  detail: (groupId: string, assignmentId: string) =>
    ['assignments', 'group', groupId, 'detail', assignmentId] as const,
  submissionsBase: (groupId: string, assignmentId: string) =>
    ['assignments', 'group', groupId, 'detail', assignmentId, 'submissions'] as const,
  submissions: (groupId: string, assignmentId: string, query: Partial<ListSubmissionsQuery>) =>
    [...assignmentQueryKeys.submissionsBase(groupId, assignmentId), query] as const,
  submissionDetail: (groupId: string, assignmentId: string, submissionId: string) =>
    [...assignmentQueryKeys.submissionsBase(groupId, assignmentId), 'detail', submissionId] as const,
}

export function useAssignmentsList(
  groupId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<ListAssignmentsQuery>> = DEFAULT_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const normalizedQuery = computed(() => normalizeAssignmentsQuery(toValue(query)))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => assignmentQueryKeys.list(resolvedGroupId.value, normalizedQuery.value)),
    queryFn: () => listAssignments(resolvedGroupId.value, normalizedQuery.value),
    enabled,
  })
}

export function useAssignment(
  groupId: MaybeRefOrGetter<string>,
  assignmentId: MaybeRefOrGetter<string>,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedAssignmentId = computed(() => toValue(assignmentId))
  const enabled = computed(
    () =>
      Boolean(resolvedGroupId.value) &&
      Boolean(resolvedAssignmentId.value) &&
      (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() => assignmentQueryKeys.detail(resolvedGroupId.value, resolvedAssignmentId.value)),
    queryFn: () => getAssignment(resolvedGroupId.value, resolvedAssignmentId.value),
    enabled,
  })
}

export function useAssignmentSubmissions(
  groupId: MaybeRefOrGetter<string>,
  assignmentId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<ListSubmissionsQuery>> = DEFAULT_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedAssignmentId = computed(() => toValue(assignmentId))
  const normalizedQuery = computed(() => normalizeSubmissionsQuery(toValue(query)))
  const enabled = computed(
    () =>
      Boolean(resolvedGroupId.value) &&
      Boolean(resolvedAssignmentId.value) &&
      (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() =>
      assignmentQueryKeys.submissions(resolvedGroupId.value, resolvedAssignmentId.value, normalizedQuery.value),
    ),
    queryFn: () => listSubmissions(resolvedGroupId.value, resolvedAssignmentId.value, normalizedQuery.value),
    enabled,
  })
}

export function useSubmission(
  groupId: MaybeRefOrGetter<string>,
  assignmentId: MaybeRefOrGetter<string>,
  submissionId: MaybeRefOrGetter<string>,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedAssignmentId = computed(() => toValue(assignmentId))
  const resolvedSubmissionId = computed(() => toValue(submissionId))
  const enabled = computed(
    () =>
      Boolean(resolvedGroupId.value) &&
      Boolean(resolvedAssignmentId.value) &&
      Boolean(resolvedSubmissionId.value) &&
      (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() =>
      assignmentQueryKeys.submissionDetail(
        resolvedGroupId.value,
        resolvedAssignmentId.value,
        resolvedSubmissionId.value,
      ),
    ),
    queryFn: () => getSubmission(resolvedGroupId.value, resolvedAssignmentId.value, resolvedSubmissionId.value),
    enabled,
  })
}

export function useCreateAssignmentMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => createAssignment(resolvedGroupId.value, payload),
    onSuccess: async (assignment: Assignment) => {
      queryClient.setQueryData(assignmentQueryKeys.detail(assignment.groupId, assignment.id), assignment)
      await invalidateAssignmentGroupQueries(queryClient, assignment.groupId)
    },
  })
}

export function useUpdateAssignmentMutation(
  groupId: MaybeRefOrGetter<string>,
  assignmentId: MaybeRefOrGetter<string>,
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedAssignmentId = computed(() => toValue(assignmentId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateAssignmentPayload) =>
      updateAssignment(resolvedGroupId.value, resolvedAssignmentId.value, payload),
    onSuccess: async (assignment: Assignment) => {
      queryClient.setQueryData(assignmentQueryKeys.detail(assignment.groupId, assignment.id), assignment)
      await invalidateAssignmentGroupQueries(queryClient, assignment.groupId)
    },
  })
}

export function useCreateSubmissionMutation(
  groupId: MaybeRefOrGetter<string>,
  assignmentId: MaybeRefOrGetter<string>,
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedAssignmentId = computed(() => toValue(assignmentId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSubmissionPayload = {}) =>
      createSubmission(resolvedGroupId.value, resolvedAssignmentId.value, payload),
    onSuccess: async (submission: Submission) => {
      queryClient.setQueryData(
        assignmentQueryKeys.submissionDetail(
          resolvedGroupId.value,
          resolvedAssignmentId.value,
          submission.id,
        ),
        submission,
      )
      await invalidateSubmissionQueries(queryClient, resolvedGroupId.value, resolvedAssignmentId.value)
    },
  })
}

export function useUpdateSubmissionMutation(
  groupId: MaybeRefOrGetter<string>,
  assignmentId: MaybeRefOrGetter<string>,
  submissionId: MaybeRefOrGetter<string>,
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedAssignmentId = computed(() => toValue(assignmentId))
  const resolvedSubmissionId = computed(() => toValue(submissionId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateSubmissionPayload) =>
      updateSubmission(resolvedGroupId.value, resolvedAssignmentId.value, resolvedSubmissionId.value, payload),
    onSuccess: async (submission: Submission) => {
      queryClient.setQueryData(
        assignmentQueryKeys.submissionDetail(
          resolvedGroupId.value,
          resolvedAssignmentId.value,
          resolvedSubmissionId.value,
        ),
        submission,
      )
      await invalidateSubmissionQueries(queryClient, resolvedGroupId.value, resolvedAssignmentId.value)
    },
  })
}

function normalizeAssignmentsQuery(query: Partial<ListAssignmentsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<ListAssignmentsQuery>
}

function normalizeSubmissionsQuery(query: Partial<ListSubmissionsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<ListSubmissionsQuery>
}

async function invalidateAssignmentGroupQueries(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: assignmentQueryKeys.group(groupId),
    }),
    queryClient.invalidateQueries({
      queryKey: ['groups', 'schedule', groupId],
    }),
    queryClient.invalidateQueries({
      queryKey: ['lessons', 'group', groupId],
    }),
  ])
}

async function invalidateSubmissionQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  groupId: string,
  assignmentId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: assignmentQueryKeys.detail(groupId, assignmentId),
    }),
    queryClient.invalidateQueries({
      queryKey: assignmentQueryKeys.submissionsBase(groupId, assignmentId),
    }),
  ])
}
