import type { components } from '../../../shared/api/generated/openapi'
import type { Assignment, CreateAssignmentPayload, UpdateAssignmentPayload } from '../api/assignments.api'
import { normalizeOptionalText } from './assignments.ui'

export type AssignmentEditorAction = 'draft' | 'publish' | 'archive'
export type AssignmentEditorFile = components['schemas']['FileObject']
export type AssignmentEditorSubmission = {
  action: AssignmentEditorAction
  title: string
  content: string
  lessonId: string
  dueAt: string
  maxScore: string
  keptFiles: AssignmentEditorFile[]
  newFiles: File[]
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

export function buildCreateAssignmentPayload(
  submission: AssignmentEditorSubmission,
  uploadedFileIds: string[],
): CreateAssignmentPayload {
  const normalizedContent = normalizeOptionalText(submission.content)
  const lessonId = normalizeOptionalText(submission.lessonId)
  const dueAt = localDateTimeValueToIso(submission.dueAt)
  const maxScore = parseOptionalInteger(submission.maxScore)
  const fileIds = [...submission.keptFiles.map((file) => file.id), ...uploadedFileIds]

  return {
    title: submission.title.trim(),
    status: resolveAssignmentStatus(submission.action),
    ...(normalizedContent
      ? {
          content: normalizedContent,
        }
      : {}),
    ...(lessonId
      ? {
          lessonId,
        }
      : {}),
    ...(dueAt
      ? {
          dueAt,
        }
      : {}),
    ...(maxScore !== null
      ? {
          maxScore,
        }
      : {}),
    ...(fileIds.length > 0
      ? {
          fileIds,
        }
      : {}),
  }
}

export function buildUpdateAssignmentPayload(
  assignment: Assignment,
  submission: AssignmentEditorSubmission,
  uploadedFileIds: string[],
): UpdateAssignmentPayload {
  const normalizedContent = normalizeOptionalText(submission.content)
  const lessonId = normalizeOptionalText(submission.lessonId)
  const dueAt = localDateTimeValueToIso(submission.dueAt)
  const maxScore = parseOptionalInteger(submission.maxScore)

  return {
    title: submission.title.trim(),
    content: normalizedContent || '',
    status: resolveAssignmentStatus(submission.action),
    lessonId: lessonId || null,
    ...(dueAt
      ? {
          dueAt,
        }
      : assignment.dueAt
        ? {}
        : {}),
    ...(maxScore !== null
      ? {
          maxScore,
        }
      : assignment.maxScore !== null
        ? {}
        : {}),
    fileIds: [...submission.keptFiles.map((file) => file.id), ...uploadedFileIds],
  }
}

export function parseOptionalInteger(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  const parsedValue = Number(normalizedValue)

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null
  }

  return parsedValue
}

function localDateTimeValueToIso(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function resolveAssignmentStatus(action: AssignmentEditorAction) {
  switch (action) {
    case 'publish':
      return 'PUBLISHED'
    case 'archive':
      return 'ARCHIVED'
    default:
      return 'DRAFT'
  }
}
