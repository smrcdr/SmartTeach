import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { lessonStatusSchema, lessonStatusValues } from '../lessons.schemas'

function normalizeOptionalDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class CreateLessonRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200),
      materialSubsectionId: z.string().uuid().optional(),
      content: z.string().optional(),
      status: lessonStatusSchema.optional(),
      sortOrder: z.number().int().min(1).optional(),
      startsAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({
          offset: true,
        }).optional(),
      ),
      endsAt: z.preprocess(
        normalizeOptionalDateTime,
        z.string().datetime({
          offset: true,
        }).optional(),
      ),
      fileIds: z.array(z.string().uuid()).optional(),
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Intro to REST contracts',
  })
  title!: string

  @ApiPropertyOptional({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId?: string

  @ApiPropertyOptional({
    example: 'Разбираем базовые REST-паттерны и итоговый контракт lesson module.',
  })
  content?: string

  @ApiPropertyOptional({
    enum: lessonStatusValues,
    example: 'DRAFT',
  })
  status?: (typeof lessonStatusValues)[number]

  @ApiPropertyOptional({
    minimum: 1,
    example: 20,
  })
  sortOrder?: number

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-15T09:00:00.000Z',
  })
  startsAt?: string

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-04-15T10:30:00.000Z',
  })
  endsAt?: string

  @ApiPropertyOptional({
    type: [String],
    example: ['aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'],
  })
  fileIds?: string[]
}
