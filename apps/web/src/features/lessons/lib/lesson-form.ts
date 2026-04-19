import type { components } from '../../../shared/api/generated/openapi'
import type { CreateLessonPayload, UpdateLessonPayload } from '../api/lessons.api'
import { normalizeOptionalText } from './lessons.ui'

export type LessonEditorAction = 'draft' | 'publish' | 'archive'
export type LessonEditorFile = components['schemas']['FileObject']
export type LessonEditorSubmission = {
  action: LessonEditorAction
  title: string
  content: string
  startsAt: string
  endsAt: string
  keptFiles: LessonEditorFile[]
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

export function buildCreateLessonPayload(
  submission: LessonEditorSubmission,
  uploadedFileIds: string[],
): CreateLessonPayload {
  const normalizedContent = normalizeOptionalText(submission.content)
  const startsAt = localDateTimeValueToIso(submission.startsAt)
  const endsAt = localDateTimeValueToIso(submission.endsAt)
  const fileIds = [...submission.keptFiles.map((file) => file.id), ...uploadedFileIds]

  return {
    title: submission.title.trim(),
    status: resolveLessonStatus(submission.action),
    ...(normalizedContent
      ? {
          content: normalizedContent,
        }
      : {}),
    ...(startsAt
      ? {
          startsAt,
        }
      : {}),
    ...(endsAt
      ? {
          endsAt,
        }
      : {}),
    ...(fileIds.length > 0
      ? {
          fileIds,
        }
      : {}),
  }
}

export function buildUpdateLessonPayload(
  submission: LessonEditorSubmission,
  uploadedFileIds: string[],
): UpdateLessonPayload {
  const normalizedContent = normalizeOptionalText(submission.content)

  return {
    title: submission.title.trim(),
    content: normalizedContent || '',
    status: resolveLessonStatus(submission.action),
    startsAt: localDateTimeValueToIso(submission.startsAt),
    endsAt: localDateTimeValueToIso(submission.endsAt),
    fileIds: [...submission.keptFiles.map((file) => file.id), ...uploadedFileIds],
  }
}

export function getLessonDateValidationMessage(startsAt: string, endsAt: string) {
  const normalizedStart = normalizeOptionalText(startsAt)
  const normalizedEnd = normalizeOptionalText(endsAt)

  if (!normalizedStart || !normalizedEnd) {
    return ''
  }

  const startDate = new Date(normalizedStart)
  const endDate = new Date(normalizedEnd)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return ''
  }

  if (startDate.getTime() > endDate.getTime()) {
    return 'Дата окончания не может быть раньше даты начала.'
  }

  return ''
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

function resolveLessonStatus(action: LessonEditorAction) {
  switch (action) {
    case 'publish':
      return 'PUBLISHED'
    case 'archive':
      return 'ARCHIVED'
    default:
      return 'DRAFT'
  }
}
