import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { groupQueryKeys } from '../../groups/composables/useGroups'
import {
  createLesson,
  getLesson,
  listLessons,
  listLinkedAssignments,
  updateLesson,
  type CreateLessonPayload,
  type Lesson,
  type ListLessonsQuery,
  type UpdateLessonPayload,
} from '../api/lessons.api'

const DEFAULT_QUERY = {}

export const lessonsQueryKeys = {
  all: ['lessons'] as const,
  group: (groupId: string) => ['lessons', 'group', groupId] as const,
  list: (groupId: string, query: Partial<ListLessonsQuery>) => ['lessons', 'group', groupId, 'list', query] as const,
  detail: (groupId: string, lessonId: string) => ['lessons', 'group', groupId, 'detail', lessonId] as const,
  linkedAssignments: (
    groupId: string,
    lessonId: string,
    query: Partial<{
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    }>,
  ) => ['lessons', 'group', groupId, 'linked-assignments', lessonId, query] as const,
}

export function useLessonsList(
  groupId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<ListLessonsQuery>> = DEFAULT_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const normalizedQuery = computed(() => normalizeLessonsQuery(toValue(query)))
  const enabled = computed(() => Boolean(resolvedGroupId.value) && (toValue(options.enabled) ?? true))

  return useQuery({
    queryKey: computed(() => lessonsQueryKeys.list(resolvedGroupId.value, normalizedQuery.value)),
    queryFn: () => listLessons(resolvedGroupId.value, normalizedQuery.value),
    enabled,
  })
}

export function useLesson(
  groupId: MaybeRefOrGetter<string>,
  lessonId: MaybeRefOrGetter<string>,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedLessonId = computed(() => toValue(lessonId))
  const enabled = computed(
    () => Boolean(resolvedGroupId.value) && Boolean(resolvedLessonId.value) && (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() => lessonsQueryKeys.detail(resolvedGroupId.value, resolvedLessonId.value)),
    queryFn: () => getLesson(resolvedGroupId.value, resolvedLessonId.value),
    enabled,
  })
}

export function useLessonLinkedAssignments(
  groupId: MaybeRefOrGetter<string>,
  lessonId: MaybeRefOrGetter<string>,
  query: MaybeRefOrGetter<Partial<{ status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }>> = DEFAULT_QUERY,
  options: { enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedLessonId = computed(() => toValue(lessonId))
  const normalizedQuery = computed(() => normalizeLinkedAssignmentsQuery(toValue(query)))
  const enabled = computed(
    () => Boolean(resolvedGroupId.value) && Boolean(resolvedLessonId.value) && (toValue(options.enabled) ?? true),
  )

  return useQuery({
    queryKey: computed(() =>
      lessonsQueryKeys.linkedAssignments(resolvedGroupId.value, resolvedLessonId.value, normalizedQuery.value),
    ),
    queryFn: () => listLinkedAssignments(resolvedGroupId.value, resolvedLessonId.value, normalizedQuery.value),
    enabled,
  })
}

export function useCreateLessonMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLessonPayload) => createLesson(resolvedGroupId.value, payload),
    onSuccess: async (lesson: Lesson) => {
      queryClient.setQueryData(lessonsQueryKeys.detail(lesson.groupId, lesson.id), lesson)
      await invalidateLessonsGroupQueries(queryClient, lesson.groupId)
    },
  })
}

export function useUpdateLessonMutation(
  groupId: MaybeRefOrGetter<string>,
  lessonId: MaybeRefOrGetter<string>,
) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const resolvedLessonId = computed(() => toValue(lessonId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateLessonPayload) => updateLesson(resolvedGroupId.value, resolvedLessonId.value, payload),
    onSuccess: async (lesson: Lesson) => {
      queryClient.setQueryData(lessonsQueryKeys.detail(lesson.groupId, lesson.id), lesson)
      await invalidateLessonsGroupQueries(queryClient, lesson.groupId)
    },
  })
}

export function useReorderLessonsMutation(groupId: MaybeRefOrGetter<string>) {
  const resolvedGroupId = computed(() => toValue(groupId))
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lessons: Lesson[]) => {
      const updates = lessons
        .map((lesson, index) => ({
          lessonId: lesson.id,
          sortOrder: index + 1,
          currentSortOrder: lesson.sortOrder,
        }))
        .filter((item) => item.sortOrder !== item.currentSortOrder)

      for (const update of updates) {
        await updateLesson(resolvedGroupId.value, update.lessonId, {
          sortOrder: update.sortOrder,
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: lessonsQueryKeys.group(resolvedGroupId.value),
      })
    },
  })
}

function normalizeLessonsQuery(query: Partial<ListLessonsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<ListLessonsQuery>
}

function normalizeLinkedAssignmentsQuery(query: Partial<{ status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<{ status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }>
}

async function invalidateLessonsGroupQueries(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: lessonsQueryKeys.group(groupId),
    }),
    queryClient.invalidateQueries({
      queryKey: groupQueryKeys.detail(groupId),
    }),
    queryClient.invalidateQueries({
      queryKey: ['groups', 'schedule', groupId],
    }),
  ])
}
