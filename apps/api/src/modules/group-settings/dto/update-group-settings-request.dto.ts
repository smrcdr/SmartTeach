import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { groupSettingsUpdateSchema } from '../../groups/groups.schemas'

export class UpdateGroupSettingsRequestDto {
  static schema = groupSettingsUpdateSchema

  @ApiPropertyOptional({
    example: true,
  })
  chatEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
  })
  lessonsEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
  })
  assignmentsEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
  })
  scheduleEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
  })
  scheduleWeeklyEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
  })
  scheduleSpecialEnabled?: boolean

  @ApiPropertyOptional({
    example: true,
  })
  usefulLinksEnabled?: boolean
}
