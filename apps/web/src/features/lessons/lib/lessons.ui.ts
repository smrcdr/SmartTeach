import type { components } from '../../../shared/api/generated/openapi'

type Lesson = components['schemas']['Lesson']
type Assignment = components['schemas']['Assignment']

export const lessonStatusLabels: Record<Lesson['status'], string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  ARCHIVED: 'Архив',
}

export const assignmentStatusLabels: Record<Assignment['status'], string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'Архив',
}

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function isLessonVisibleToUser(lesson: Pick<Lesson, 'status'>, canManageLessons: boolean) {
  return canManageLessons || lesson.status === 'PUBLISHED'
}

export function getLessonSummary(value: unknown, fallback = 'Контент урока пока не заполнен.') {
  return normalizeOptionalText(value) || fallback
}

export function formatLessonDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatLessonSchedule(startsAt: unknown, endsAt: unknown) {
  const normalizedStart = normalizeOptionalText(startsAt)
  const normalizedEnd = normalizeOptionalText(endsAt)

  if (!normalizedStart) {
    return 'Без даты'
  }

  const formattedStart = formatLessonDateTime(normalizedStart)

  if (!normalizedEnd) {
    return `${formattedStart} · время окончания не указано`
  }

  return `${formattedStart} - ${new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(normalizedEnd))}`
}

export function formatOptionalDueAt(value: unknown) {
  const normalizedValue = normalizeOptionalText(value)

  return normalizedValue ? formatLessonDateTime(normalizedValue) : 'Без дедлайна'
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} Б`
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} КБ`
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} МБ`
}
