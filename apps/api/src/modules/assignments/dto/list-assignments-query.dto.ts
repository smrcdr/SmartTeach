import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { assignmentStatusSchema, assignmentStatusValues } from '../assignments.schemas'

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

export class ListAssignmentsQueryDto {
  static schema = z
    .object({
      status: z.preprocess(normalizeOptionalUppercaseString, assignmentStatusSchema.optional()),
      lessonId: z.preprocess(normalizeOptionalUuid, z.string().uuid().optional()),
    })
    .strict()

  @ApiPropertyOptional({
    enum: assignmentStatusValues,
    example: 'PUBLISHED',
  })
  status?: (typeof assignmentStatusValues)[number]

  @ApiPropertyOptional({
    format: 'uuid',
    example: '77777777-7777-4777-8777-777777777777',
  })
  lessonId?: string
}
