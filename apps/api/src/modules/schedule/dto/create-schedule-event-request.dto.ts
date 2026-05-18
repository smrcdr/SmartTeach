import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { scheduleEventTypeSchema, scheduleEventTypeValues } from '../schedule.schemas'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class CreateScheduleEventRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200),
      description: z.string().optional(),
      eventType: scheduleEventTypeSchema.default('SPECIAL'),
      startsAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({ offset: true }).optional(),
      ),
      endsAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({ offset: true }).optional(),
      ),
      weekday: z.number().int().min(1).max(7).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      location: z.string().max(255).optional(),
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Demo day rehearsal',
  })
  title!: string

  @ApiPropertyOptional({
    example: 'Репетиция финальной презентации перед защитой.',
  })
  description?: string

  @ApiPropertyOptional({
    enum: scheduleEventTypeValues,
    example: 'SPECIAL',
  })
  eventType?: (typeof scheduleEventTypeValues)[number]

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-16T12:00:00.000Z',
  })
  startsAt?: string

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-16T13:30:00.000Z',
  })
  endsAt?: string

  @ApiPropertyOptional({ minimum: 1, maximum: 7, example: 1 })
  weekday?: number

  @ApiPropertyOptional({ example: '09:00' })
  startTime?: string

  @ApiPropertyOptional({ example: '10:30' })
  endTime?: string

  @ApiPropertyOptional({
    example: 'Zoom / Room 204',
  })
  location?: string
}
