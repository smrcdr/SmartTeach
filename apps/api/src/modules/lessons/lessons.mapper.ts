import type { Prisma } from '@prisma/client'
import { fileSelect, mapFileToDto } from '../files/files.mapper'
import { LessonDto } from './dto/lesson.dto'

export const lessonSelect = {
  id: true,
  groupId: true,
  title: true,
  content: true,
  status: true,
  sortOrder: true,
  startsAt: true,
  endsAt: true,
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
} satisfies Prisma.LessonSelect

export type LessonRecord = Prisma.LessonGetPayload<{
  select: typeof lessonSelect
}>

export function mapLessonToDto(lesson: LessonRecord, fileUrlsById: Map<string, string>): LessonDto {
  return {
    id: lesson.id,
    groupId: lesson.groupId,
    title: lesson.title,
    content: lesson.content,
    status: lesson.status,
    sortOrder: lesson.sortOrder,
    startsAt: lesson.startsAt?.toISOString() ?? null,
    endsAt: lesson.endsAt?.toISOString() ?? null,
    publishedAt: lesson.publishedAt?.toISOString() ?? null,
    archivedAt: lesson.archivedAt?.toISOString() ?? null,
    createdByUserId: lesson.createdByUserId,
    files: lesson.files.map((link) => mapFileToDto(link.file, fileUrlsById.get(link.file.id) ?? '')),
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  }
}
