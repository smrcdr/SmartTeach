import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { groupAccessModeSchema, groupAccessModeValues, groupSettingsSchema } from '../groups.schemas'
import { GroupSettingsDto } from './group-settings.dto'

export class CreateGroupRequestDto {
  static schema = z
    .object({
      name: z.string().trim().min(2).max(150),
      description: z.string().trim().optional(),
      avatarFileId: z.string().uuid().nullable().optional(),
      catalogImageFileId: z.string().uuid().nullable().optional(),
      accessMode: groupAccessModeSchema,
      settings: groupSettingsSchema,
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 150,
    example: 'API Patterns Lab',
  })
  name!: string

  @ApiPropertyOptional({
    example: 'Группа для разбора компонентного мышления и интерфейсных паттернов.',
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

  @ApiProperty({
    enum: groupAccessModeValues,
    example: 'BY_REQUEST',
  })
  accessMode!: (typeof groupAccessModeValues)[number]

  @ApiProperty({
    type: () => GroupSettingsDto,
  })
  settings!: GroupSettingsDto
}
