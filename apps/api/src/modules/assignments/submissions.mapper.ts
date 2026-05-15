import type { Prisma } from '@prisma/client'
import { fileSelect, mapFileToDto } from '../files/files.mapper'
import { mapPublicUserToDto, publicUserSelect } from '../users/users.mapper'
import type { AvatarUrlByFileId } from '../users/user-avatar.utils'
import { SubmissionDto } from './dto/submission.dto'

export const submissionSelect = {
  id: true,
  assignmentId: true,
  authorId: true,
  attemptNumber: true,
  text: true,
  status: true,
  score: true,
  feedback: true,
  submittedAt: true,
  reviewedByUserId: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  files: {
    select: {
      file: {
        select: fileSelect,
      },
    },
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        fileId: 'asc',
      },
    ],
  },
  author: {
    select: publicUserSelect,
  },
  reviewedByUser: {
    select: publicUserSelect,
  },
} satisfies Prisma.SubmissionSelect

export type SubmissionRecord = Prisma.SubmissionGetPayload<{
  select: typeof submissionSelect
}>

export function mapSubmissionToDto(
  submission: SubmissionRecord,
  fileUrlsById: Map<string, string>,
  avatarUrlByFileId?: AvatarUrlByFileId,
): SubmissionDto {
  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    authorId: submission.authorId,
    attemptNumber: submission.attemptNumber,
    text: submission.text,
    status: submission.status,
    files: submission.files.map((link) =>
      mapFileToDto(link.file, fileUrlsById.get(link.file.id) ?? ''),
    ),
    score: submission.score,
    feedback: submission.feedback,
    submittedAt: submission.submittedAt?.toISOString() ?? null,
    reviewedByUserId: submission.reviewedByUserId,
    reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    author: mapPublicUserToDto(submission.author, avatarUrlByFileId),
    reviewer: submission.reviewedByUser
      ? mapPublicUserToDto(submission.reviewedByUser, avatarUrlByFileId)
      : null,
  }
}
