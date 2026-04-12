import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { submissionStatusSchema, submissionStatusValues } from '../assignments.schemas'

export class UpdateSubmissionRequestDto {
  static schema = z
    .object({
      text: z.string().optional(),
      fileIds: z.array(z.string().uuid()).optional(),
      status: submissionStatusSchema.optional(),
      score: z.number().int().min(0).optional(),
      feedback: z.string().optional(),
    })
    .strict()

  @ApiPropertyOptional({
    example: 'Обновленная работа с исправлением замечаний.',
  })
  text?: string

  @ApiPropertyOptional({
    type: [String],
    example: ['bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1'],
  })
  fileIds?: string[]

  @ApiPropertyOptional({
    enum: submissionStatusValues,
    example: 'REVIEWED',
  })
  status?: (typeof submissionStatusValues)[number]

  @ApiPropertyOptional({
    minimum: 0,
    example: 95,
  })
  score?: number

  @ApiPropertyOptional({
    example: 'Хорошая структура ответа, но добавьте тест на отказ в доступе.',
  })
  feedback?: string
}
