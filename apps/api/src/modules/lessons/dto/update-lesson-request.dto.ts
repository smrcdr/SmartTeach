import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { lessonStatusSchema, lessonStatusValues } from '../lessons.schemas'

export class UpdateLessonRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      materialSubsectionId: z.string().uuid().nullable().optional(),
      content: z.string().optional(),
      status: lessonStatusSchema.optional(),
      sortOrder: z.number().int().min(1).optional(),
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
    format: 'uuid',
    nullable: true,
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId?: string | null

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
    type: [String],
    example: ['aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3'],
  })
  fileIds?: string[]
}
