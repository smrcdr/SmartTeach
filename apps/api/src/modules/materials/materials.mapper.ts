import type { Prisma } from '@prisma/client'
import { MaterialLessonDto } from './dto/material-lesson.dto'
import {
  MaterialSectionDto,
  MaterialSubsectionDto,
} from './dto/material-section.dto'
import {
  MaterialSectionSummaryDto,
  MaterialSubsectionDetailsDto,
} from './dto/material-subsection-details.dto'

export const materialLessonSelect = {
  id: true,
  groupId: true,
  materialSubsectionId: true,
  title: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LessonSelect

export const materialSectionSelect = {
  id: true,
  groupId: true,
  title: true,
  sortOrder: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  subsections: {
    select: {
      id: true,
      groupId: true,
      sectionId: true,
      title: true,
      sortOrder: true,
      createdByUserId: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        createdAt: 'asc',
      },
      {
        id: 'asc',
      },
    ],
  },
} satisfies Prisma.MaterialSectionSelect

export const materialSubsectionDetailsSelect = {
  id: true,
  groupId: true,
  sectionId: true,
  title: true,
  sortOrder: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      lessons: true,
    },
  },
  section: {
    select: {
      id: true,
      title: true,
      sortOrder: true,
    },
  },
  lessons: {
    select: materialLessonSelect,
    orderBy: [
      {
        sortOrder: 'asc',
      },
      {
        createdAt: 'asc',
      },
      {
        id: 'asc',
      },
    ],
  },
} satisfies Prisma.MaterialSubsectionSelect

export type MaterialSectionRecord = Prisma.MaterialSectionGetPayload<{
  select: typeof materialSectionSelect
}>

export type MaterialSubsectionRecord = MaterialSectionRecord['subsections'][number]

export type MaterialSubsectionDetailsRecord = Prisma.MaterialSubsectionGetPayload<{
  select: typeof materialSubsectionDetailsSelect
}>

export type MaterialLessonRecord = Prisma.LessonGetPayload<{
  select: typeof materialLessonSelect
}>

export function mapMaterialLessonToDto(lesson: MaterialLessonRecord): MaterialLessonDto {
  return {
    id: lesson.id,
    groupId: lesson.groupId,
    materialSubsectionId: lesson.materialSubsectionId,
    title: lesson.title,
    status: lesson.status,
    sortOrder: lesson.sortOrder,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  }
}

export function mapMaterialSubsectionToDto(
  subsection: MaterialSubsectionRecord,
): MaterialSubsectionDto {
  return {
    id: subsection.id,
    groupId: subsection.groupId,
    sectionId: subsection.sectionId,
    title: subsection.title,
    sortOrder: subsection.sortOrder,
    lessonsCount: subsection._count.lessons,
    createdByUserId: subsection.createdByUserId,
    createdAt: subsection.createdAt.toISOString(),
    updatedAt: subsection.updatedAt.toISOString(),
  }
}

export function mapMaterialSectionToDto(section: MaterialSectionRecord): MaterialSectionDto {
  return {
    id: section.id,
    groupId: section.groupId,
    title: section.title,
    sortOrder: section.sortOrder,
    createdByUserId: section.createdByUserId,
    subsections: section.subsections.map((subsection) => mapMaterialSubsectionToDto(subsection)),
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  }
}

export function mapMaterialSubsectionDetailsToDto(
  subsection: MaterialSubsectionDetailsRecord,
): MaterialSubsectionDetailsDto {
  const section: MaterialSectionSummaryDto = {
    id: subsection.section.id,
    title: subsection.section.title,
    sortOrder: subsection.section.sortOrder,
  }

  return {
    section,
    subsection: {
      id: subsection.id,
      groupId: subsection.groupId,
      sectionId: subsection.sectionId,
      title: subsection.title,
      sortOrder: subsection.sortOrder,
      lessonsCount: subsection._count.lessons,
      createdByUserId: subsection.createdByUserId,
      createdAt: subsection.createdAt.toISOString(),
      updatedAt: subsection.updatedAt.toISOString(),
    },
    lessons: subsection.lessons.map((lesson) => mapMaterialLessonToDto(lesson)),
  }
}
