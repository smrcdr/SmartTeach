import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

export type Lesson = components['schemas']['Lesson']
export type LessonStatus = Lesson['status']
export type LinkedAssignment = components['schemas']['Assignment']
export type LessonFile = components['schemas']['FileObject']
export type ListLessonsQuery = NonNullable<paths['/groups/{groupId}/lessons']['get']['parameters']['query']>
export type ListLinkedAssignmentsQuery = NonNullable<paths['/groups/{groupId}/assignments']['get']['parameters']['query']>

type ErrorResponse = components['schemas']['ErrorResponse']
type UploadLessonFileBody = paths['/files']['post']['requestBody']['content']['multipart/form-data']
type CreateLessonRequestBody = paths['/groups/{groupId}/lessons']['post']['requestBody']['content']['application/json']
type UpdateLessonRequestBody = paths['/groups/{groupId}/lessons/{lessonId}']['patch']['requestBody']['content']['application/json']

export type CreateLessonPayload = {
  title: string
  content?: string
  status?: LessonStatus
  sortOrder?: number
  startsAt?: string
  endsAt?: string
  fileIds?: string[]
}

export type UpdateLessonPayload = {
  title?: string
  content?: string
  status?: LessonStatus
  sortOrder?: number
  startsAt?: string | null
  endsAt?: string | null
  fileIds?: string[]
}

export class LessonsApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'LessonsApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function listLessons(groupId: string, query: Partial<ListLessonsQuery> = {}) {
  const normalizedQuery = normalizeLessonsQuery(query)
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/lessons', {
    params: {
      path: {
        groupId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data
  }

  throw new LessonsApiError(error, response.status, 'Не удалось загрузить список уроков')
}

export async function getLesson(groupId: string, lessonId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/lessons/{lessonId}', {
    params: {
      path: {
        groupId,
        lessonId,
      },
    },
  })

  if (data) {
    return data
  }

  throw new LessonsApiError(error, response.status, 'Не удалось загрузить урок')
}

export async function createLesson(groupId: string, payload: CreateLessonPayload) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/lessons', {
    params: {
      path: {
        groupId,
      },
    },
    body: payload as CreateLessonRequestBody,
  })

  if (data) {
    return data
  }

  throw new LessonsApiError(error, response.status, 'Не удалось создать урок')
}

export async function updateLesson(groupId: string, lessonId: string, payload: UpdateLessonPayload) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}/lessons/{lessonId}', {
    params: {
      path: {
        groupId,
        lessonId,
      },
    },
    body: payload as UpdateLessonRequestBody,
  })

  if (data) {
    return data
  }

  throw new LessonsApiError(error, response.status, 'Не удалось обновить урок')
}

export async function listLinkedAssignments(
  groupId: string,
  lessonId: string,
  query: Partial<Omit<ListLinkedAssignmentsQuery, 'lessonId'>> = {},
) {
  const normalizedQuery = normalizeLinkedAssignmentsQuery({
    ...query,
    lessonId,
  })
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/assignments', {
    params: {
      path: {
        groupId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data
  }

  throw new LessonsApiError(error, response.status, 'Не удалось загрузить связанные задания')
}

export async function uploadLessonFile(file: File) {
  const formData = new FormData()

  formData.set('file', file)
  formData.set('folder', 'lessons')

  const { data, error, response } = await apiClient.POST('/files', {
    body: formData as unknown as UploadLessonFileBody,
  })

  if (data) {
    return data
  }

  throw new LessonsApiError(error, response.status, 'Не удалось загрузить файл')
}

export async function deleteUploadedFile(fileId: string) {
  const { error, response } = await apiClient.DELETE('/files/{fileId}', {
    params: {
      path: {
        fileId,
      },
    },
  })

  if (response.ok) {
    return
  }

  throw new LessonsApiError(error, response.status, 'Не удалось удалить временный файл')
}

export function getLessonsErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof LessonsApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

function normalizeLessonsQuery(query: Partial<ListLessonsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<ListLessonsQuery>
}

function normalizeLinkedAssignmentsQuery(query: Partial<ListLinkedAssignmentsQuery>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as Partial<ListLinkedAssignmentsQuery>
}
