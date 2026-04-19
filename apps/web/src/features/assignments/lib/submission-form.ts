import type { components } from '../../../shared/api/generated/openapi'
import type { UpdateSubmissionPayload } from '../api/assignments.api'
import { normalizeOptionalText } from './assignments.ui'

export type SubmissionEditorAction = 'draft' | 'submit'
export type SubmissionEditorFile = components['schemas']['FileObject']
export type SubmissionEditorSubmission = {
  action: SubmissionEditorAction
  text: string
  keptFiles: SubmissionEditorFile[]
  newFiles: File[]
}

export function buildUpdateSubmissionPayload(
  submission: SubmissionEditorSubmission,
  uploadedFileIds: string[],
): UpdateSubmissionPayload {
  const normalizedText = normalizeOptionalText(submission.text)

  return {
    text: normalizedText || '',
    status: submission.action === 'submit' ? 'SUBMITTED' : 'DRAFT',
    fileIds: [...submission.keptFiles.map((file) => file.id), ...uploadedFileIds],
  }
}
