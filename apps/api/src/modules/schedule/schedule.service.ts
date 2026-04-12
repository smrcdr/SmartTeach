import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  GroupRole,
  GroupStatus,
  Prisma,
  ScheduleEventStatus,
} from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { CreateScheduleEventRequestDto } from './dto/create-schedule-event-request.dto'
import { ListScheduleEventsQueryDto } from './dto/list-schedule-events-query.dto'
import { ListScheduleQueryDto } from './dto/list-schedule-query.dto'
import { ScheduleEntryDto } from './dto/schedule-entry.dto'
import { ScheduleEventDto } from './dto/schedule-event.dto'
import { UpdateScheduleEventRequestDto } from './dto/update-schedule-event-request.dto'
import {
  mapAssignmentToScheduleEntry,
  mapLessonToScheduleEntry,
  mapScheduleEventToDto,
  mapScheduleEventToEntry,
  scheduleAssignmentEntrySelect,
  scheduleEventSelect,
  scheduleLessonEntrySelect,
  type ScheduleEventRecord,
} from './schedule.mapper'

const SCHEDULE_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])
const SCHEDULE_ENTRY_ORDER: Record<ScheduleEntryDto['sourceType'], number> = {
  LESSON: 0,
  ASSIGNMENT_DEADLINE: 1,
  CUSTOM_EVENT: 2,
}

@Injectable()
export class ScheduleService {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  async listSchedule(
    groupId: string,
    userId: string,
    query: ListScheduleQueryDto,
  ): Promise<ScheduleEntryDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const range = this.resolveTimeRange(query.from, query.to)
    const [lessons, assignments, customEvents] = await Promise.all([
      this.prismaService.lesson.findMany({
        where: {
          groupId,
          startsAt: {
            not: null,
          },
          endsAt: {
            not: null,
          },
          ...this.buildWindowWhere<Prisma.LessonWhereInput>({
            from: range.from,
            to: range.to,
            startsAtField: 'startsAt',
            endsAtField: 'endsAt',
          }),
        },
        select: scheduleLessonEntrySelect,
        orderBy: [
          {
            startsAt: 'asc',
          },
          {
            endsAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      }),
      this.prismaService.assignment.findMany({
        where: {
          groupId,
          dueAt: {
            not: null,
            ...(range.from
              ? {
                  gte: range.from,
                }
              : {}),
            ...(range.to
              ? {
                  lte: range.to,
                }
              : {}),
          },
        },
        select: scheduleAssignmentEntrySelect,
        orderBy: [
          {
            dueAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      }),
      this.prismaService.scheduleEvent.findMany({
        where: {
          groupId,
          status: ScheduleEventStatus.PLANNED,
          ...this.buildWindowWhere<Prisma.ScheduleEventWhereInput>({
            from: range.from,
            to: range.to,
            startsAtField: 'startsAt',
            endsAtField: 'endsAt',
          }),
        },
        select: scheduleEventSelect,
        orderBy: [
          {
            startsAt: 'asc',
          },
          {
            endsAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      }),
    ])

    return this.sortScheduleEntries([
      ...lessons.map(mapLessonToScheduleEntry),
      ...assignments.map(mapAssignmentToScheduleEntry),
      ...customEvents.map(mapScheduleEventToEntry),
    ])
  }

  async listScheduleEvents(
    groupId: string,
    userId: string,
    query: ListScheduleEventsQueryDto,
  ): Promise<ScheduleEventDto[]> {
    await this.assertGroupAccess(groupId, userId)

    const range = this.resolveTimeRange(query.from, query.to)
    const events = await this.prismaService.scheduleEvent.findMany({
      where: {
        groupId,
        ...(query.status !== undefined
          ? {
              status: query.status,
            }
          : {}),
        ...this.buildWindowWhere<Prisma.ScheduleEventWhereInput>({
          from: range.from,
          to: range.to,
          startsAtField: 'startsAt',
          endsAtField: 'endsAt',
        }),
      },
      select: scheduleEventSelect,
      orderBy: [
        {
          startsAt: 'asc',
        },
        {
          endsAt: 'asc',
        },
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    })

    return events.map(mapScheduleEventToDto)
  }

  async createScheduleEvent(
    groupId: string,
    userId: string,
    payload: CreateScheduleEventRequestDto,
  ): Promise<ScheduleEventDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const dates = this.resolveEventDates(payload.startsAt, payload.endsAt)
    const title = payload.title.trim()

    await this.assertStandaloneEvent(groupId, title, dates.startsAt, dates.endsAt)

    const createdEvent = await this.prismaService.scheduleEvent.create({
      data: {
        groupId,
        title,
        description: this.normalizeNullableText(payload.description),
        startsAt: dates.startsAt,
        endsAt: dates.endsAt,
        location: this.normalizeNullableText(payload.location),
        status: ScheduleEventStatus.PLANNED,
        createdByUserId: userId,
      },
      select: scheduleEventSelect,
    })

    return mapScheduleEventToDto(createdEvent)
  }

  async getScheduleEvent(
    groupId: string,
    eventId: string,
    userId: string,
  ): Promise<ScheduleEventDto> {
    await this.assertGroupAccess(groupId, userId)

    const event = await this.getScheduleEventRecordOrThrow(groupId, eventId)

    return mapScheduleEventToDto(event)
  }

  async updateScheduleEvent(
    groupId: string,
    eventId: string,
    userId: string,
    payload: UpdateScheduleEventRequestDto,
  ): Promise<ScheduleEventDto> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const existingEvent = await this.getScheduleEventRecordOrThrow(groupId, eventId)
    const title = payload.title !== undefined ? payload.title.trim() : existingEvent.title
    const dates = this.resolveEventDates(
      payload.startsAt ?? existingEvent.startsAt.toISOString(),
      payload.endsAt ?? existingEvent.endsAt.toISOString(),
    )

    await this.assertStandaloneEvent(groupId, title, dates.startsAt, dates.endsAt)

    const data: Prisma.ScheduleEventUpdateInput = {
      ...(payload.title !== undefined
        ? {
            title,
          }
        : {}),
      ...(payload.description !== undefined
        ? {
            description: this.normalizeNullableText(payload.description),
          }
        : {}),
      ...(payload.startsAt !== undefined
        ? {
            startsAt: dates.startsAt,
          }
        : {}),
      ...(payload.endsAt !== undefined
        ? {
            endsAt: dates.endsAt,
          }
        : {}),
      ...(payload.location !== undefined
        ? {
            location: this.normalizeNullableText(payload.location),
          }
        : {}),
      ...(payload.status !== undefined
        ? {
            status: payload.status,
            cancelledAt: this.resolveCancelledAt(
              existingEvent.cancelledAt,
              payload.status,
            ),
          }
        : {}),
    }

    if (Object.keys(data).length === 0) {
      return mapScheduleEventToDto(existingEvent)
    }

    const updatedEvent = await this.prismaService.scheduleEvent.update({
      where: {
        id: eventId,
      },
      data,
      select: scheduleEventSelect,
    })

    return mapScheduleEventToDto(updatedEvent)
  }

  async deleteScheduleEvent(groupId: string, eventId: string, userId: string): Promise<void> {
    await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    await this.getScheduleEventRecordOrThrow(groupId, eventId)

    await this.prismaService.scheduleEvent.delete({
      where: {
        id: eventId,
      },
    })
  }

  private async assertGroupAccess(
    groupId: string,
    userId: string,
    options: {
      requireManage?: boolean
      requireWritable?: boolean
    } = {},
  ) {
    const group = await this.prismaService.group.findUnique({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        status: true,
        settings: {
          select: {
            scheduleEnabled: true,
          },
        },
      },
    })

    if (!group || group.status === GroupStatus.DELETED) {
      throw new NotFoundException('Group not found')
    }

    const membership = await this.prismaService.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      select: {
        role: true,
      },
    })

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group')
    }

    if (!group.settings) {
      throw new NotFoundException('Group settings not found')
    }

    if (!group.settings.scheduleEnabled) {
      throw new ForbiddenException('Schedule module is disabled for this group')
    }

    if (options.requireManage && !SCHEDULE_MANAGE_ROLES.has(membership.role)) {
      throw new ForbiddenException('You cannot manage schedule events in this group')
    }

    if (options.requireWritable && group.status === GroupStatus.ARCHIVED) {
      throw new ForbiddenException('Archived groups are read-only')
    }

    return membership
  }

  private async getScheduleEventRecordOrThrow(
    groupId: string,
    eventId: string,
  ): Promise<ScheduleEventRecord> {
    const event = await this.prismaService.scheduleEvent.findFirst({
      where: {
        id: eventId,
        groupId,
      },
      select: scheduleEventSelect,
    })

    if (!event) {
      throw new NotFoundException('Schedule event not found')
    }

    return event
  }

  private resolveTimeRange(from?: string, to?: string) {
    const normalizedFrom = from ? new Date(from) : undefined
    const normalizedTo = to ? new Date(to) : undefined

    if (
      normalizedFrom &&
      normalizedTo &&
      normalizedFrom.getTime() > normalizedTo.getTime()
    ) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['to: must be greater than or equal to from'],
      })
    }

    return {
      from: normalizedFrom,
      to: normalizedTo,
    }
  }

  private resolveEventDates(startsAt: string, endsAt: string) {
    const normalizedStartsAt = new Date(startsAt)
    const normalizedEndsAt = new Date(endsAt)

    if (normalizedStartsAt.getTime() > normalizedEndsAt.getTime()) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['endsAt: must be greater than or equal to startsAt'],
      })
    }

    return {
      startsAt: normalizedStartsAt,
      endsAt: normalizedEndsAt,
    }
  }

  private buildWindowWhere<T extends Prisma.LessonWhereInput | Prisma.ScheduleEventWhereInput>(
    params: {
      from?: Date
      to?: Date
      startsAtField: 'startsAt'
      endsAtField: 'endsAt'
    },
  ): Partial<T> {
    const andConditions: Array<Record<string, Prisma.DateTimeFilter>> = []

    if (params.from) {
      andConditions.push({
        [params.endsAtField]: {
          gte: params.from,
        },
      })
    }

    if (params.to) {
      andConditions.push({
        [params.startsAtField]: {
          lte: params.to,
        },
      })
    }

    return andConditions.length > 0
      ? ({
          AND: andConditions,
        } as Partial<T>)
      : {}
  }

  private sortScheduleEntries(entries: ScheduleEntryDto[]) {
    return [...entries].sort((left, right) => {
      if (left.startsAt !== right.startsAt) {
        return left.startsAt.localeCompare(right.startsAt)
      }

      const leftEndsAt = left.endsAt ?? left.startsAt
      const rightEndsAt = right.endsAt ?? right.startsAt

      if (leftEndsAt !== rightEndsAt) {
        return leftEndsAt.localeCompare(rightEndsAt)
      }

      if (left.sourceType !== right.sourceType) {
        return SCHEDULE_ENTRY_ORDER[left.sourceType] - SCHEDULE_ENTRY_ORDER[right.sourceType]
      }

      return left.sourceId.localeCompare(right.sourceId)
    })
  }

  private normalizeNullableText(value?: string) {
    if (value === undefined) {
      return undefined
    }

    const normalized = value.trim()

    return normalized.length > 0 ? normalized : null
  }

  private resolveCancelledAt(currentCancelledAt: Date | null, nextStatus: ScheduleEventStatus) {
    if (nextStatus === ScheduleEventStatus.CANCELLED) {
      return currentCancelledAt ?? new Date()
    }

    return null
  }

  private async assertStandaloneEvent(
    groupId: string,
    title: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    const [matchingLesson, matchingAssignment] = await Promise.all([
      this.prismaService.lesson.findFirst({
        where: {
          groupId,
          title,
          startsAt,
          endsAt,
        },
        select: {
          id: true,
        },
      }),
      startsAt.getTime() !== endsAt.getTime()
        ? Promise.resolve(null)
        : this.prismaService.assignment.findFirst({
            where: {
              groupId,
              title,
              dueAt: startsAt,
            },
            select: {
              id: true,
            },
          }),
    ])

    if (matchingLesson) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['schedule event duplicates lesson-derived schedule entry'],
      })
    }

    if (matchingAssignment) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['schedule event duplicates assignment-derived schedule entry'],
      })
    }
  }
}
