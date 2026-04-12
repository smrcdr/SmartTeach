import { ApiProperty } from '@nestjs/swagger'

export class GroupSettingsDto {
  @ApiProperty({
    example: true,
  })
  chatEnabled!: boolean

  @ApiProperty({
    example: true,
  })
  lessonsEnabled!: boolean

  @ApiProperty({
    example: true,
  })
  assignmentsEnabled!: boolean

  @ApiProperty({
    example: true,
  })
  scheduleEnabled!: boolean
}
