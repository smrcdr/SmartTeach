import type { components, paths } from '../../../shared/api/generated/openapi'
import { apiClient } from '../../../shared/api/client/http'

type RawAssignment = components['schemas']['Assignment']
type RawSubmission = components['schemas']['Submission']

export type Assignment = Omit<
  RawAssignment,
  'lessonId' | 'content' | 'dueAt' | 'maxScore' | 'publishedAt' | 'archivedAt'
> & {
  lessonId: string | null
  content: string | null
  dueAt: string | null
  maxScore: number | null
  publishedAt: string | null
  archivedAt: string | null
}

export type Submission = Omit<
  RawSubmission,
  'text' | 'score' | 'feedback' | 'submittedAt' | 'reviewedByUserId' | 'reviewedAt' | 'reviewer'
> & {
  text: string | null
  score: number | null
  feedback: string | null
  submittedAt: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewer: components['schemas']['PublicUser'] | null
}
export type AssignmentStatus = Assignment['status']
export type SubmissionStatus = Submission['status']
export type AssignmentFile = components['schemas']['FileObject']
export type ListAssignmentsQuery = NonNullable<paths['/groups/{groupId}/assignments']['get']['parameters']['query']>
export type ListSubmissionsQuery = NonNullable<
  paths['/groups/{groupId}/assignments/{assignmentId}/submissions']['get']['parameters']['query']
>

type ErrorResponse = components['schemas']['ErrorResponse']
type UploadFileBody = paths['/files']['post']['requestBody']['content']['multipart/form-data']
type CreateAssignmentRequestBody = paths['/groups/{groupId}/assignments']['post']['requestBody']['content']['application/json']
type UpdateAssignmentRequestBody =
  paths['/groups/{groupId}/assignments/{assignmentId}']['patch']['requestBody']['content']['application/json']
type CreateSubmissionRequestBody =
  paths['/groups/{groupId}/assignments/{assignmentId}/submissions']['post']['requestBody']['content']['application/json']
type UpdateSubmissionRequestBody =
  paths['/groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}']['patch']['requestBody']['content']['application/json']

export type CreateAssignmentPayload = {
  lessonId?: string
  title: string
  content?: string
  status?: AssignmentStatus
  dueAt?: string
  maxScore?: number
  fileIds?: string[]
}

export type UpdateAssignmentPayload = {
  lessonId?: string | null
  title?: string
  content?: string
  status?: AssignmentStatus
  dueAt?: string
  maxScore?: number
  fileIds?: string[]
}

export type CreateSubmissionPayload = {
  text?: string
  fileIds?: string[]
  status?: Extract<SubmissionStatus, 'DRAFT' | 'SUBMITTED'>
}

export type UpdateSubmissionPayload = {
  text?: string
  fileIds?: string[]
  status?: SubmissionStatus
  score?: number
  feedback?: string
}

export class AssignmentsApiError extends Error {
  readonly statusCode: number
  readonly errors: string[]

  constructor(error: ErrorResponse | undefined, statusCode: number, fallbackMessage: string) {
    super(error?.message ?? fallbackMessage)
    this.name = 'AssignmentsApiError'
    this.statusCode = error?.statusCode ?? statusCode
    this.errors = error?.errors ?? []
  }
}

export async function listAssignments(groupId: string, query: Partial<ListAssignmentsQuery> = {}) {
  const normalizedQuery = normalizeAssignmentsQuery(query)
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/assignments', {
    params: {
      path: {
        groupId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data.map((assignment) => normalizeAssignment(assignment as RawAssignment))
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось загрузить задания группы')
}

export async function getAssignment(groupId: string, assignmentId: string) {
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/assignments/{assignmentId}', {
    params: {
      path: {
        groupId,
        assignmentId,
      },
    },
  })

  if (data) {
    return normalizeAssignment(data as RawAssignment)
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось загрузить задание')
}

export async function createAssignment(groupId: string, payload: CreateAssignmentPayload) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/assignments', {
    params: {
      path: {
        groupId,
      },
    },
    body: payload as CreateAssignmentRequestBody,
  })

  if (data) {
    return normalizeAssignment(data as RawAssignment)
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось создать задание')
}

export async function updateAssignment(groupId: string, assignmentId: string, payload: UpdateAssignmentPayload) {
  const { data, error, response } = await apiClient.PATCH('/groups/{groupId}/assignments/{assignmentId}', {
    params: {
      path: {
        groupId,
        assignmentId,
      },
    },
    body: payload as UpdateAssignmentRequestBody,
  })

  if (data) {
    return normalizeAssignment(data as RawAssignment)
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось обновить задание')
}

export async function listSubmissions(
  groupId: string,
  assignmentId: string,
  query: Partial<ListSubmissionsQuery> = {},
) {
  const normalizedQuery = normalizeSubmissionsQuery(query)
  const { data, error, response } = await apiClient.GET('/groups/{groupId}/assignments/{assignmentId}/submissions', {
    params: {
      path: {
        groupId,
        assignmentId,
      },
      query: normalizedQuery,
    },
  })

  if (data) {
    return data.map((submission) => normalizeSubmission(submission as RawSubmission))
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось загрузить попытки сдачи')
}

export async function getSubmission(groupId: string, assignmentId: string, submissionId: string) {
  const { data, error, response } = await apiClient.GET(
    '/groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}',
    {
      params: {
        path: {
          groupId,
          assignmentId,
          submissionId,
        },
      },
    },
  )

  if (data) {
    return normalizeSubmission(data as RawSubmission)
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось загрузить попытку сдачи')
}

export async function createSubmission(groupId: string, assignmentId: string, payload: CreateSubmissionPayload = {}) {
  const { data, error, response } = await apiClient.POST('/groups/{groupId}/assignments/{assignmentId}/submissions', {
    params: {
      path: {
        groupId,
        assignmentId,
      },
    },
    body: payload as CreateSubmissionRequestBody,
  })

  if (data) {
    return normalizeSubmission(data as RawSubmission)
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось создать новую попытку')
}

export async function updateSubmission(
  groupId: string,
  assignmentId: string,
  submissionId: string,
  payload: UpdateSubmissionPayload,
) {
  const { data, error, response } = await apiClient.PATCH(
    '/groups/{groupId}/assignments/{assignmentId}/submissions/{submissionId}',
    {
      params: {
        path: {
          groupId,
          assignmentId,
          submissionId,
        },
      },
      body: payload as UpdateSubmissionRequestBody,
    },
  )

  if (data) {
    return normalizeSubmission(data as RawSubmission)
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось обновить попытку сдачи')
}

export async function uploadAssignmentFile(file: File) {
  return uploadFile(file, 'assignments')
}

export async function uploadAssignmentFiles(files: File[]) {
  return uploadFilesWithRollback(files, uploadAssignmentFile)
}

export async function uploadSubmissionFile(file: File) {
  return uploadFile(file, 'submissions')
}

export async function uploadSubmissionFiles(files: File[]) {
  return uploadFilesWithRollback(files, uploadSubmissionFile)
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

  throw new AssignmentsApiError(error, response.status, 'Не удалось удалить временный файл')
}

export function getAssignmentsErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AssignmentsApiError) {
    return error.errors[0] ?? error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}

async function uploadFile(file: File, folder: 'assignments' | 'submissions') {
  const formData = new FormData()

  formData.set('file', file)
  formData.set('folder', folder)

  const { data, error, response } = await apiClient.POST('/files', {
    body: formData as unknown as UploadFileBody,
  })

  if (data) {
    return data
  }

  throw new AssignmentsApiError(error, response.status, 'Не удалось загрузить файл')
}

async function uploadFilesWithRollback(
  files: File[],
  uploadFn: (file: File) => Promise<AssignmentFile>,
) {
  if (files.length === 0) {
    return []
  }

  const uploadResults = await Promise.allSettled(files.map((file) => uploadFn(file)))
  const uploadedFiles = uploadResults.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  const failedUpload = uploadResults.find((result): result is PromiseRejectedResult => result.status === 'rejected')

  if (!failedUpload) {
    return uploadedFiles
  }

  if (uploadedFiles.length > 0) {
    await Promise.allSettled(uploadedFiles.map((file) => deleteUploadedFile(file.id)))
  }

  throw failedUpload.reason
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

function normalizeAssignment(assignment: RawAssignment): Assignment {
  return {
    ...assignment,
    lessonId: normalizeNullableString(assignment.lessonId),
    content: normalizeNullableString(assignment.content),
    dueAt: normalizeNullableString(assignment.dueAt),
    maxScore: normalizeNullableNumber(assignment.maxScore),
    publishedAt: normalizeNullableString(assignment.publishedAt),
    archivedAt: normalizeNullableString(assignment.archivedAt),
  }
}

function normalizeSubmission(submission: RawSubmission): Submission {
  return {
    ...submission,
    text: normalizeNullableString(submission.text),
    score: normalizeNullableNumber(submission.score),
    feedback: normalizeNullableString(submission.feedback),
    submittedAt: normalizeNullableString(submission.submittedAt),
    reviewedByUserId: normalizeNullableString(submission.reviewedByUserId),
    reviewedAt: normalizeNullableString(submission.reviewedAt),
    reviewer: submission.reviewer ?? null,
  }
}

function normalizeNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function normalizeNullableNumber(value: unknown) {
  return typeof value === 'number' ? value : null
}
