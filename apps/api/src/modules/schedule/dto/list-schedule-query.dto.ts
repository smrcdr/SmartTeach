import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class ListScheduleQueryDto {
  static schema = z
    .object({
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
