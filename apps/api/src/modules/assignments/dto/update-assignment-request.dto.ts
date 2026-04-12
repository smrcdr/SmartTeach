import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { assignmentStatusSchema, assignmentStatusValues } from '../assignments.schemas'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class UpdateAssignmentRequestDto {
  static schema = z
    .object({
      lessonId: z.string().uuid().optional(),
      title: z.string().trim().min(2).max(200).optional(),
      content: z.string().optional(),
      status: assignmentStatusSchema.optional(),
      dueAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({
          offset: true,
        }).optional(),
      ),
      maxScore: z.number().int().min(0).optional(),
      fileIds: z.array(z.string().uuid()).optional(),
    })
    .strict()

  @ApiPropertyOptional({
    format: 'uuid',
    example: '77777777-7777-4777-8777-777777777777',
  })
  lessonId?: string

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 200,
    example: 'Updated assignment title',
  })
  title?: string

  @ApiPropertyOptional({
    example: 'Уточните формат финального отчета и дедлайн.',
  })
  content?: string

  @ApiPropertyOptional({
    enum: assignmentStatusValues,
    example: 'ARCHIVED',
  })
  status?: (typeof assignmentStatusValues)[number]

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-22T18:00:00.000Z',
  })
  dueAt?: string

  @ApiPropertyOptional({
    minimum: 0,
    example: 80,
  })
  maxScore?: number

  @ApiPropertyOptional({
    type: [String],
    example: ['aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4'],
  })
  fileIds?: string[]
}
