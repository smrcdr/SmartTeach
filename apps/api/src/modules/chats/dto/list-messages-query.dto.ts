import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

function normalizeOptionalInteger(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  if (normalized.length === 0) {
    return undefined
  }

  const parsed = Number.parseInt(normalized, 10)

  return Number.isNaN(parsed) ? value : parsed
}

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class ListMessagesQueryDto {
  static schema = z
    .object({
      limit: z.preprocess(normalizeOptionalInteger, z.number().int().min(1).max(200).optional()),
      before: z.preprocess(
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
    minimum: 1,
    maximum: 200,
    example: 50,
  })
  limit?: number

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-12T12:00:00.000Z',
  })
  before?: string
}
