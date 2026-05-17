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

  @ApiProperty({
    example: true,
  })
  scheduleWeeklyEnabled!: boolean

  @ApiProperty({
    example: true,
  })
  scheduleSpecialEnabled!: boolean

  @ApiProperty({
    example: true,
  })
  usefulLinksEnabled!: boolean
}
