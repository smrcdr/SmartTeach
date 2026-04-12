import type { Prisma } from '@prisma/client'
import { ScheduleEntryDto } from './dto/schedule-entry.dto'
import { ScheduleEventDto } from './dto/schedule-event.dto'

export const scheduleEventSelect = {
  id: true,
  groupId: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  location: true,
  status: true,
  createdByUserId: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ScheduleEventSelect

export const scheduleLessonEntrySelect = {
  id: true,
  groupId: true,
  title: true,
  content: true,
  startsAt: true,
  endsAt: true,
} satisfies Prisma.LessonSelect

export const scheduleAssignmentEntrySelect = {
  id: true,
  groupId: true,
  title: true,
  content: true,
  dueAt: true,
} satisfies Prisma.AssignmentSelect

export type ScheduleEventRecord = Prisma.ScheduleEventGetPayload<{
  select: typeof scheduleEventSelect
}>

export type ScheduleLessonEntryRecord = Prisma.LessonGetPayload<{
  select: typeof scheduleLessonEntrySelect
}>

export type ScheduleAssignmentEntryRecord = Prisma.AssignmentGetPayload<{
  select: typeof scheduleAssignmentEntrySelect
}>

export function mapScheduleEventToDto(event: ScheduleEventRecord): ScheduleEventDto {
  return {
    id: event.id,
    groupId: event.groupId,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    location: event.location,
    status: event.status,
    createdByUserId: event.createdByUserId,
    cancelledAt: event.cancelledAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }
}

export function mapLessonToScheduleEntry(lesson: ScheduleLessonEntryRecord): ScheduleEntryDto {
  return {
    sourceType: 'LESSON',
    sourceId: lesson.id,
    groupId: lesson.groupId,
    title: lesson.title,
    description: lesson.content,
    startsAt: lesson.startsAt!.toISOString(),
    endsAt: lesson.endsAt!.toISOString(),
  }
}

export function mapAssignmentToScheduleEntry(
  assignment: ScheduleAssignmentEntryRecord,
): ScheduleEntryDto {
  return {
    sourceType: 'ASSIGNMENT_DEADLINE',
    sourceId: assignment.id,
    groupId: assignment.groupId,
    title: assignment.title,
    description: assignment.content,
    startsAt: assignment.dueAt!.toISOString(),
    endsAt: null,
  }
}

export function mapScheduleEventToEntry(event: ScheduleEventRecord): ScheduleEntryDto {
  return {
    sourceType: 'CUSTOM_EVENT',
    sourceId: event.id,
    groupId: event.groupId,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
  }
}
