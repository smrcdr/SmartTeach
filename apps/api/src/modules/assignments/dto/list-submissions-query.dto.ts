import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

function normalizeOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim().toLowerCase()

  if (normalized.length === 0) {
    return undefined
  }

  if (normalized === 'true') {
    return true
  }

  if (normalized === 'false') {
    return false
  }

  return value
}

export class ListSubmissionsQueryDto {
  static schema = z
    .object({
      mineOnly: z.preprocess(normalizeOptionalBoolean, z.boolean().optional()),
    })
    .strict()

  @ApiPropertyOptional({
    example: true,
  })
  mineOnly?: boolean
}
