import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { lessonStatusSchema, lessonStatusValues } from '../lessons.schemas'

function normalizeOptionalUppercaseString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim().toUpperCase()

  return normalized.length > 0 ? normalized : undefined
}

function normalizeOptionalUuid(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class ListLessonsQueryDto {
  static schema = z
    .object({
      status: z.preprocess(normalizeOptionalUppercaseString, lessonStatusSchema.optional()),
      materialSubsectionId: z.preprocess(normalizeOptionalUuid, z.string().uuid().optional()),
    })
    .strict()

  @ApiPropertyOptional({
    enum: lessonStatusValues,
    example: 'PUBLISHED',
  })
  status?: (typeof lessonStatusValues)[number]

  @ApiPropertyOptional({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId?: string
}
