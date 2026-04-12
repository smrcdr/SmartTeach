import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { scheduleEventStatusSchema, scheduleEventStatusValues } from '../schedule.schemas'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class UpdateScheduleEventRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      description: z.string().optional(),
      startsAt: z.preprocess(
        normalizeOptionalDateTime,
        z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),
      ),
      endsAt: z.preprocess(
        normalizeOptionalDateTime,
        z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),
      ),
      location: z.string().max(255).optional(),
      status: scheduleEventStatusSchema.optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 200,
    example: 'Updated rehearsal',
  })
  title?: string

  @ApiPropertyOptional({
    example: 'Перенесли репетицию, обновите тайминг и роли.',
  })
  description?: string

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-16T14:00:00.000Z',
  })
  startsAt?: string

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-16T15:00:00.000Z',
  })
  endsAt?: string

  @ApiPropertyOptional({
    example: 'Main campus auditorium',
  })
  location?: string

  @ApiPropertyOptional({
    enum: scheduleEventStatusValues,
    example: 'CANCELLED',
  })
  status?: (typeof scheduleEventStatusValues)[number]
}
