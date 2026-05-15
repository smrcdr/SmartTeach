import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import {
  submissionCreateStatusSchema,
  submissionCreateStatusValues,
} from '../assignments.schemas'

export class CreateSubmissionRequestDto {
  static schema = z
    .object({
      text: z.string().optional(),
      fileIds: z.array(z.string().uuid()).optional(),
      status: submissionCreateStatusSchema.optional(),
    })
    .strict()

  @ApiPropertyOptional({
    example: 'Готовая работа и комментарии по спорным местам реализации.',
  })
  text?: string

  @ApiPropertyOptional({
    type: [String],
    example: ['bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1'],
  })
  fileIds?: string[]

  @ApiPropertyOptional({
    enum: submissionCreateStatusValues,
    example: 'DRAFT',
  })
  status?: (typeof submissionCreateStatusValues)[number]
}
