import type { Prisma } from '@prisma/client'
import { fileSelect, mapFileToDto } from '../files/files.mapper'
import { AssignmentDto } from './dto/assignment.dto'

export const assignmentSelect = {
  id: true,
  groupId: true,
  lessonId: true,
  materialSectionId: true,
  materialSubsectionId: true,
  title: true,
  content: true,
  status: true,
  dueAt: true,
  maxScore: true,
  publishedAt: true,
  archivedAt: true,
  createdByUserId: true,
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
} satisfies Prisma.AssignmentSelect

export type AssignmentRecord = Prisma.AssignmentGetPayload<{
  select: typeof assignmentSelect
}>

export function mapAssignmentToDto(
  assignment: AssignmentRecord,
  fileUrlsById: Map<string, string>,
): AssignmentDto {
  return {
    id: assignment.id,
    groupId: assignment.groupId,
    lessonId: assignment.lessonId,
    materialSectionId: assignment.materialSectionId,
    materialSubsectionId: assignment.materialSubsectionId,
    title: assignment.title,
    content: assignment.content,
    status: assignment.status,
    dueAt: assignment.dueAt?.toISOString() ?? null,
    maxScore: assignment.maxScore,
    publishedAt: assignment.publishedAt?.toISOString() ?? null,
    archivedAt: assignment.archivedAt?.toISOString() ?? null,
    createdByUserId: assignment.createdByUserId,
    files: assignment.files.map((link) =>
      mapFileToDto(link.file, fileUrlsById.get(link.file.id) ?? ''),
    ),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  }
}
