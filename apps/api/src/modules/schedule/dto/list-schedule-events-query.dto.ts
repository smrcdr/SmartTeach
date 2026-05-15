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

function normalizeOptionalUppercaseString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim().toUpperCase()

  return normalized.length > 0 ? normalized : undefined
}

export class ListScheduleEventsQueryDto {
  static schema = z
    .object({
      status: z.preprocess(normalizeOptionalUppercaseString, scheduleEventStatusSchema.optional()),
      from: z.preprocess(
        normalizeOptionalDateTime,
        z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),
      ),
      to: z.preprocess(
        normalizeOptionalDateTime,
        z
          .string()
          .datetime({
            offset: true,
          })
          .optional(),
      ),
    })
    .strict()

  @ApiPropertyOptional({
    enum: scheduleEventStatusValues,
    example: 'PLANNED',
  })
  status?: (typeof scheduleEventStatusValues)[number]

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-01T00:00:00.000Z',
  })
  from?: string

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-30T23:59:59.999Z',
  })
  to?: string
}
