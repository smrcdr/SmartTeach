import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  GroupRole,
  Prisma,
  ScheduleEventStatus,
  ScheduleEventType,
} from '@prisma/client'
import { PrismaService } from '../../database/prisma/prisma.service'
import { AuthorizationService } from '../../security/authorization.service'
import { CreateScheduleEventRequestDto } from './dto/create-schedule-event-request.dto'
import { ListScheduleEventsQueryDto } from './dto/list-schedule-events-query.dto'
import { ListScheduleQueryDto } from './dto/list-schedule-query.dto'
import { ScheduleEntryDto } from './dto/schedule-entry.dto'
import { ScheduleEventDto } from './dto/schedule-event.dto'
import { UpdateScheduleEventRequestDto } from './dto/update-schedule-event-request.dto'
import {
  mapAssignmentToScheduleEntry,
  mapScheduleEventToDto,
  mapScheduleEventToEntry,
  scheduleAssignmentEntrySelect,
  scheduleEventSelect,
  type ScheduleAssignmentEntryRecord,
  type ScheduleEventRecord,
} from './schedule.mapper'

const SCHEDULE_MANAGE_ROLES = new Set<GroupRole>([GroupRole.OWNER, GroupRole.ADMIN])
const SCHEDULE_ENTRY_ORDER: Record<ScheduleEntryDto['sourceType'], number> = {
  ASSIGNMENT_DEADLINE: 0,
  CUSTOM_EVENT: 1,
}

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(AuthorizationService)
    private readonly authorizationService: AuthorizationService,
  ) {}

  async listSchedule(
    groupId: string,
    userId: string,
    query: ListScheduleQueryDto,
  ): Promise<ScheduleEntryDto[]> {
    const access = await this.assertGroupAccess(groupId, userId)

    const range = this.resolveTimeRange(query.from, query.to)
    const [assignments, customEvents] = await Promise.all([
      access.assignmentsEnabled
        ? this.prismaService.assignment.findMany({
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
          })
        : Promise.resolve<ScheduleAssignmentEntryRecord[]>([]),
      this.prismaService.scheduleEvent.findMany({
        where: {
          groupId,
          eventType: ScheduleEventType.SPECIAL,
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
        ...(query.eventType !== undefined
          ? {
              eventType: query.eventType,
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
    const access = await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    this.assertScheduleSubtypeEnabled(access, payload.eventType ?? ScheduleEventType.SPECIAL)
    const eventShape = this.resolveEventShape(payload)
    const title = payload.title.trim()

    if (eventShape.eventType === ScheduleEventType.SPECIAL) {
      await this.assertStandaloneEvent(groupId, title, eventShape.startsAt, eventShape.endsAt)
    }

    const createdEvent = await this.prismaService.scheduleEvent.create({
      data: {
        groupId,
        title,
        description: this.normalizeNullableText(payload.description),
        eventType: eventShape.eventType,
        startsAt: eventShape.startsAt,
        endsAt: eventShape.endsAt,
        weekday: eventShape.weekday,
        startMinutes: eventShape.startMinutes,
        endMinutes: eventShape.endMinutes,
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
    const access = await this.assertGroupAccess(groupId, userId, {
      requireManage: true,
      requireWritable: true,
    })

    const existingEvent = await this.getScheduleEventRecordOrThrow(groupId, eventId)
    const title = payload.title !== undefined ? payload.title.trim() : existingEvent.title
    this.assertScheduleSubtypeEnabled(access, existingEvent.eventType)
    const eventShape = existingEvent.eventType === ScheduleEventType.WEEKLY
      ? this.resolveWeeklyShape({
          weekday: payload.weekday ?? existingEvent.weekday ?? undefined,
          startTime: payload.startTime ?? this.minutesToTime(existingEvent.startMinutes),
          endTime: payload.endTime ?? this.minutesToTime(existingEvent.endMinutes),
        })
      : this.resolveSpecialShape({
          startsAt: payload.startsAt ?? existingEvent.startsAt.toISOString(),
          endsAt: payload.endsAt ?? existingEvent.endsAt.toISOString(),
        })

    if (existingEvent.eventType === ScheduleEventType.SPECIAL) {
      await this.assertStandaloneEvent(groupId, title, eventShape.startsAt, eventShape.endsAt)
    }

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
            startsAt: eventShape.startsAt,
          }
        : {}),
      ...(payload.endsAt !== undefined
        ? {
            endsAt: eventShape.endsAt,
          }
        : {}),
      ...(existingEvent.eventType === ScheduleEventType.WEEKLY && payload.weekday !== undefined
        ? {
            weekday: eventShape.weekday,
            startsAt: eventShape.startsAt,
            endsAt: eventShape.endsAt,
          }
        : {}),
      ...(existingEvent.eventType === ScheduleEventType.WEEKLY && payload.startTime !== undefined
        ? {
            startMinutes: eventShape.startMinutes,
            startsAt: eventShape.startsAt,
          }
        : {}),
      ...(existingEvent.eventType === ScheduleEventType.WEEKLY && payload.endTime !== undefined
        ? {
            endMinutes: eventShape.endMinutes,
            endsAt: eventShape.endsAt,
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
    const context = await this.authorizationService.authorizeGroupAccess(groupId, userId, {
      requiredFeature: 'scheduleEnabled',
      featureErrorMessage: 'Schedule module is disabled for this group',
      requiredRoles: options.requireManage ? [...SCHEDULE_MANAGE_ROLES] : undefined,
      roleErrorMessage: 'You cannot manage schedule events in this group',
      requireWritable: options.requireWritable ?? false,
    })

    return {
      role: context.membership!.role,
      assignmentsEnabled: context.settings.assignmentsEnabled,
      scheduleWeeklyEnabled: context.settings.scheduleWeeklyEnabled,
      scheduleSpecialEnabled: context.settings.scheduleSpecialEnabled,
    }
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

  private resolveEventShape(payload: CreateScheduleEventRequestDto) {
    return payload.eventType === ScheduleEventType.WEEKLY
      ? this.resolveWeeklyShape(payload)
      : this.resolveSpecialShape(payload)
  }

  private resolveSpecialShape(payload: { startsAt?: string, endsAt?: string }) {
    if (!payload.startsAt || !payload.endsAt) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['startsAt and endsAt are required for special events'],
      })
    }

    const dates = this.resolveEventDates(payload.startsAt, payload.endsAt)
    return {
      eventType: ScheduleEventType.SPECIAL,
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      weekday: null,
      startMinutes: null,
      endMinutes: null,
    }
  }

  private resolveWeeklyShape(payload: { weekday?: number, startTime?: string | null, endTime?: string | null }) {
    if (!payload.weekday || !payload.startTime || !payload.endTime) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['weekday, startTime and endTime are required for weekly events'],
      })
    }

    const startMinutes = this.timeToMinutes(payload.startTime)
    const endMinutes = this.timeToMinutes(payload.endTime)

    if (endMinutes <= startMinutes) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['endTime: must be greater than startTime'],
      })
    }

    const date = new Date(Date.UTC(2026, 0, 4 + payload.weekday))
    const startsAt = new Date(date.getTime() + startMinutes * 60_000)
    const endsAt = new Date(date.getTime() + endMinutes * 60_000)

    return {
      eventType: ScheduleEventType.WEEKLY,
      startsAt,
      endsAt,
      weekday: payload.weekday,
      startMinutes,
      endMinutes,
    }
  }

  private timeToMinutes(value: string) {
    const [hoursText, minutesText] = value.split(':')
    const hours = Number(hoursText)
    const minutes = Number(minutesText)

    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['time: must be in HH:mm format'],
      })
    }

    return hours * 60 + minutes
  }

  private minutesToTime(value: number | null) {
    if (value === null) {
      return null
    }

    const hours = Math.floor(value / 60).toString().padStart(2, '0')
    const minutes = (value % 60).toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  private assertScheduleSubtypeEnabled(
    access: { scheduleWeeklyEnabled: boolean, scheduleSpecialEnabled: boolean },
    eventType: ScheduleEventType,
  ) {
    if (eventType === ScheduleEventType.WEEKLY && !access.scheduleWeeklyEnabled) {
      throw new ForbiddenException('Weekly schedule is disabled for this group')
    }

    if (eventType === ScheduleEventType.SPECIAL && !access.scheduleSpecialEnabled) {
      throw new ForbiddenException('Special schedule is disabled for this group')
    }
  }

  private buildWindowWhere<T extends Prisma.ScheduleEventWhereInput>(
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
    const matchingAssignment =
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
          })

    if (await matchingAssignment) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: ['schedule event duplicates assignment-derived schedule entry'],
      })
    }
  }
}
