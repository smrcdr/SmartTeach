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
      avatarFileId: z.string().uuid().nullable().optional(),
      catalogImageFileId: z.string().uuid().nullable().optional(),
      accessMode: groupAccessModeSchema.optional(),
      status: groupEditableStatusSchema.optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 150,
    example: 'API Patterns Lab',
  })
  name?: string

  @ApiPropertyOptional({
    example: 'Обновленное описание учебной группы.',
  })
  description?: string

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  avatarFileId?: string | null

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  })
  catalogImageFileId?: string | null

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
