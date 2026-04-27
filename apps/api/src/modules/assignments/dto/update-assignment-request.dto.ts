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
      lessonId: z.string().uuid().nullable().optional(),
      materialSectionId: z.string().uuid().nullable().optional(),
      materialSubsectionId: z.string().uuid().nullable().optional(),
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
    nullable: true,
    example: '77777777-7777-4777-8777-777777777777',
  })
  lessonId?: string | null

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: '88888888-8888-4888-8888-888888888888',
  })
  materialSectionId?: string | null

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId?: string | null

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
