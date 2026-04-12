import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { groupAccessModeSchema, groupAccessModeValues, groupSettingsSchema } from '../groups.schemas'
import { GroupSettingsDto } from './group-settings.dto'

export class CreateGroupRequestDto {
  static schema = z
    .object({
      name: z.string().trim().min(2).max(150),
      description: z.string().trim().optional(),
      accessMode: groupAccessModeSchema,
      settings: groupSettingsSchema,
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 150,
    example: 'Frontend Patterns Lab',
  })
  name!: string

  @ApiPropertyOptional({
    example: 'Группа для разбора компонентного мышления и интерфейсных паттернов.',
  })
  description?: string

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
