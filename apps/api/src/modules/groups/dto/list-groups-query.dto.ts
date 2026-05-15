import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import {
  groupAccessModeSchema,
  groupAccessModeValues,
  groupStatusSchema,
  groupStatusValues,
} from '../groups.schemas'

function normalizeOptionalString(value: unknown) {
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

function normalizeOptionalBoolean(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true' || normalized === '1') {
      return true
    }

    if (normalized === 'false' || normalized === '0') {
      return false
    }
  }

  return value
}

export class ListGroupsQueryDto {
  static schema = z
    .object({
      search: z.preprocess(normalizeOptionalString, z.string().max(150).optional()),
      code: z.preprocess(normalizeOptionalUppercaseString, z.string().max(20).optional()),
      accessMode: z.preprocess(
        normalizeOptionalUppercaseString,
        groupAccessModeSchema.optional(),
      ),
      status: z.preprocess(normalizeOptionalUppercaseString, groupStatusSchema.optional()),
      joinedOnly: z.preprocess(normalizeOptionalBoolean, z.boolean().optional()),
    })
    .strict()

  @ApiPropertyOptional({
    example: 'patterns',
  })
  search?: string

  @ApiPropertyOptional({
    example: 'WEBSPR1',
  })
  code?: string

  @ApiPropertyOptional({
    enum: groupAccessModeValues,
    example: 'OPEN',
  })
  accessMode?: (typeof groupAccessModeValues)[number]

  @ApiPropertyOptional({
    enum: groupStatusValues,
    example: 'ACTIVE',
  })
  status?: (typeof groupStatusValues)[number]

  @ApiPropertyOptional({
    example: true,
  })
  joinedOnly?: boolean
}
