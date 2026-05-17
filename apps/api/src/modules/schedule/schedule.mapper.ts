import type { Prisma } from '@prisma/client'
import { ScheduleEntryDto } from './dto/schedule-entry.dto'
import { ScheduleEventDto } from './dto/schedule-event.dto'

export const scheduleEventSelect = {
  id: true,
  groupId: true,
  title: true,
  description: true,
  eventType: true,
  startsAt: true,
  endsAt: true,
  weekday: true,
  startMinutes: true,
  endMinutes: true,
  location: true,
  status: true,
  createdByUserId: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ScheduleEventSelect

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

export type ScheduleAssignmentEntryRecord = Prisma.AssignmentGetPayload<{
  select: typeof scheduleAssignmentEntrySelect
}>

export function mapScheduleEventToDto(event: ScheduleEventRecord): ScheduleEventDto {
  return {
    id: event.id,
    groupId: event.groupId,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    weekday: event.weekday,
    startTime: minutesToTime(event.startMinutes),
    endTime: minutesToTime(event.endMinutes),
    location: event.location,
    status: event.status,
    createdByUserId: event.createdByUserId,
    cancelledAt: event.cancelledAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
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

function minutesToTime(value: number | null) {
  if (value === null) {
    return null
  }

  const hours = Math.floor(value / 60).toString().padStart(2, '0')
  const minutes = (value % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
