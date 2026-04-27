import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { scheduleEntryTypeValues } from '../schedule.schemas'

export class ScheduleEntryDto {
  @ApiProperty({
    enum: scheduleEntryTypeValues,
    example: 'CUSTOM_EVENT',
  })
  sourceType!: (typeof scheduleEntryTypeValues)[number]

  @ApiProperty({
    format: 'uuid',
    example: 'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  })
  sourceId!: string

  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Intro to API Contracts',
  })
  title!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Разбираем правила построения контрактов и release discipline.',
  })
  description!: string | null

  @ApiProperty({
    format: 'date-time',
  })
  startsAt!: string

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  endsAt!: string | null
}
