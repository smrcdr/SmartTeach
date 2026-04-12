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

export class ListLessonsQueryDto {
  static schema = z
    .object({
      status: z.preprocess(normalizeOptionalUppercaseString, lessonStatusSchema.optional()),
    })
    .strict()

  @ApiPropertyOptional({
    enum: lessonStatusValues,
    example: 'PUBLISHED',
  })
  status?: (typeof lessonStatusValues)[number]
}
