import type { Assignment, AssignmentStatus, Submission, SubmissionStatus } from '../api/assignments.api'

export type SubmissionGroup = {
  author: Submission['author']
  attempts: Submission[]
  latestSubmission: Submission
}

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликовано',
  ARCHIVED: 'Архив',
}

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Отправлено',
  REVIEWED: 'Проверено',
}

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function isAssignmentVisibleToUser(assignment: Pick<Assignment, 'status'>, canManageAssignments: boolean) {
  return canManageAssignments || assignment.status === 'PUBLISHED'
}

export function getAssignmentSummary(value: unknown, fallback = 'Описание задания пока не заполнено.') {
  return normalizeOptionalText(value) || fallback
}

export function getSubmissionSummary(value: unknown, fallback = 'Текст попытки пока не добавлен.') {
  return normalizeOptionalText(value) || fallback
}

export function formatAssignmentDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatAssignmentDueAt(value: unknown) {
  const normalizedValue = normalizeOptionalText(value)

  return normalizedValue ? formatAssignmentDateTime(normalizedValue) : 'Без дедлайна'
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

export function formatSubmissionScore(score: number | null, maxScore: number | null) {
  if (score === null) {
    return maxScore === null ? 'Без оценки' : `Без оценки из ${maxScore}`
  }

  return maxScore === null ? `${score}` : `${score} / ${maxScore}`
}

export function sortAssignmentsByDueAt(assignments: Assignment[]) {
  return [...assignments].sort((left, right) => compareAssignmentsByDueAt(left, right))
}

export function getLatestSubmission(submissions: Submission[]) {
  return [...submissions].sort(compareSubmissionsByAttemptDesc)[0] ?? null
}

export function getCurrentDraftSubmission(submissions: Submission[]) {
  return [...submissions].sort(compareSubmissionsByAttemptDesc).find((submission) => submission.status === 'DRAFT') ?? null
}

export function canCreateNextSubmissionAttempt(submissions: Submission[]) {
  const currentDraft = getCurrentDraftSubmission(submissions)

  if (currentDraft) {
    return false
  }

  const latestSubmission = getLatestSubmission(submissions)

  return latestSubmission === null || latestSubmission.status === 'SUBMITTED' || latestSubmission.status === 'REVIEWED'
}

export function groupSubmissionsByAuthor(submissions: Submission[]): SubmissionGroup[] {
  const groupsByAuthor = new Map<string, Submission[]>()

  for (const submission of submissions) {
    const knownSubmissions = groupsByAuthor.get(submission.authorId) ?? []

    knownSubmissions.push(submission)
    groupsByAuthor.set(submission.authorId, knownSubmissions)
  }

  return [...groupsByAuthor.values()]
    .map((attempts) => {
      const sortedAttempts = [...attempts].sort(compareSubmissionsByAttemptDesc)

      return {
        author: sortedAttempts[0].author,
        attempts: sortedAttempts,
        latestSubmission: sortedAttempts[0],
      }
    })
    .sort(
      (left, right) =>
        new Date(right.latestSubmission.updatedAt).getTime() - new Date(left.latestSubmission.updatedAt).getTime(),
    )
}

function compareAssignmentsByDueAt(left: Assignment, right: Assignment) {
  const leftDueAt = normalizeOptionalText(left.dueAt)
  const rightDueAt = normalizeOptionalText(right.dueAt)

  if (leftDueAt && rightDueAt) {
    return new Date(leftDueAt).getTime() - new Date(rightDueAt).getTime()
  }

  if (leftDueAt) {
    return -1
  }

  if (rightDueAt) {
    return 1
  }

  return left.title.localeCompare(right.title, 'ru')
}

function compareSubmissionsByAttemptDesc(left: Submission, right: Submission) {
  if (left.attemptNumber !== right.attemptNumber) {
    return right.attemptNumber - left.attemptNumber
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
}
