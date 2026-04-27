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
      materialSectionId: z.preprocess(normalizeOptionalUuid, z.string().uuid().optional()),
      materialSubsectionId: z.preprocess(normalizeOptionalUuid, z.string().uuid().optional()),
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

  @ApiPropertyOptional({
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
  })
  materialSectionId?: string

  @ApiPropertyOptional({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId?: string
}
