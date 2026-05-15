import type { Prisma } from '@prisma/client'
import { fileSelect, mapFileToDto } from '../files/files.mapper'
import { AssignmentDto } from './dto/assignment.dto'

export const assignmentSelect = {
  id: true,
  groupId: true,
  lessonTargets: {
    select: {
      lessonId: true,
      sortOrder: true,
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        lessonId: 'asc',
      },
    ],
  },
  materialSectionTargets: {
    select: {
      materialSectionId: true,
      sortOrder: true,
      materialSection: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        materialSectionId: 'asc',
      },
    ],
  },
  materialSubsectionTargets: {
    select: {
      materialSubsectionId: true,
      sortOrder: true,
      materialSubsection: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        materialSubsectionId: 'asc',
      },
    ],
  },
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
    targets: {
      lessons: assignment.lessonTargets.map((target) => ({
        id: target.lesson.id,
        title: target.lesson.title,
        sortOrder: target.sortOrder,
      })),
      materialSections: assignment.materialSectionTargets.map((target) => ({
        id: target.materialSection.id,
        title: target.materialSection.title,
        sortOrder: target.sortOrder,
      })),
      materialSubsections: assignment.materialSubsectionTargets.map((target) => ({
        id: target.materialSubsection.id,
        title: target.materialSubsection.title,
        sortOrder: target.sortOrder,
      })),
    },
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
