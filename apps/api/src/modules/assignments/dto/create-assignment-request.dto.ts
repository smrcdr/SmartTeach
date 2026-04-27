import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { assignmentStatusSchema, assignmentStatusValues } from '../assignments.schemas'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class CreateAssignmentRequestDto {
  static schema = z
    .object({
      lessonId: z.string().uuid().optional(),
      materialSectionId: z.string().uuid().optional(),
      materialSubsectionId: z.string().uuid().optional(),
      title: z.string().trim().min(2).max(200),
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
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
  })
  materialSectionId?: string

  @ApiPropertyOptional({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId?: string

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Prepare contract review',
  })
  title!: string

  @ApiPropertyOptional({
    example: 'Сравните итоговую реализацию с OpenAPI и опишите расхождения.',
  })
  content?: string

  @ApiPropertyOptional({
    enum: assignmentStatusValues,
    example: 'DRAFT',
  })
  status?: (typeof assignmentStatusValues)[number]

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-20T18:00:00.000Z',
  })
  dueAt?: string

  @ApiPropertyOptional({
    minimum: 0,
    example: 100,
  })
  maxScore?: number

  @ApiPropertyOptional({
    type: [String],
    example: ['aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4'],
  })
  fileIds?: string[]
}
