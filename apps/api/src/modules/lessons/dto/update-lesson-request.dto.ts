import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { lessonStatusSchema, lessonStatusValues } from '../lessons.schemas'

function normalizeOptionalNullableDateTime(value: unknown) {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class UpdateLessonRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      content: z.string().optional(),
      status: lessonStatusSchema.optional(),
      sortOrder: z.number().int().min(1).optional(),
      startsAt: z.preprocess(
        normalizeOptionalNullableDateTime,
        z
          .string()
          .datetime({
            offset: true,
          })
          .nullable()
          .optional(),
      ),
      endsAt: z.preprocess(
        normalizeOptionalNullableDateTime,
        z
          .string()
          .datetime({
            offset: true,
          })
          .nullable()
          .optional(),
      ),
      fileIds: z.array(z.string().uuid()).optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 200,
    example: 'Updated lesson title',
  })
  title?: string

  @ApiPropertyOptional({
    example: 'Обновленный конспект урока.',
  })
  content?: string

  @ApiPropertyOptional({
    enum: lessonStatusValues,
    example: 'ARCHIVED',
  })
  status?: (typeof lessonStatusValues)[number]

  @ApiPropertyOptional({
    minimum: 1,
    example: 5,
  })
  sortOrder?: number

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-20T09:00:00.000Z',
    nullable: true,
  })
  startsAt?: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-20T10:30:00.000Z',
    nullable: true,
  })
  endsAt?: string | null

  @ApiPropertyOptional({
    type: [String],
    example: ['aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'],
  })
  fileIds?: string[]
}
