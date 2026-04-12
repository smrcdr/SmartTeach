import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import {
  groupAccessModeSchema,
  groupAccessModeValues,
  groupEditableStatusSchema,
  groupEditableStatusValues,
} from '../groups.schemas'

export class UpdateGroupRequestDto {
  static schema = z
    .object({
      name: z.string().trim().min(2).max(150).optional(),
      description: z.string().trim().optional(),
      accessMode: groupAccessModeSchema.optional(),
      status: groupEditableStatusSchema.optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 150,
    example: 'Frontend Patterns Lab',
  })
  name?: string

  @ApiPropertyOptional({
    example: 'Обновленное описание учебной группы.',
  })
  description?: string

  @ApiPropertyOptional({
    enum: groupAccessModeValues,
    example: 'OPEN',
  })
  accessMode?: (typeof groupAccessModeValues)[number]

  @ApiPropertyOptional({
    enum: groupEditableStatusValues,
    example: 'ARCHIVED',
  })
  status?: (typeof groupEditableStatusValues)[number]
}
