import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { scheduleEventStatusValues } from '../schedule.schemas'

export class ScheduleEventDto {
  @ApiProperty({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Demo day rehearsal',
  })
  title!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Прогоним презентации и технический чек.',
  })
  description!: string | null

  @ApiProperty({
    format: 'date-time',
  })
  startsAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  endsAt!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Zoom / Room 204',
  })
  location!: string | null

  @ApiProperty({
    enum: scheduleEventStatusValues,
    example: 'PLANNED',
  })
  status!: (typeof scheduleEventStatusValues)[number]

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  createdByUserId!: string

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  cancelledAt!: string | null

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string
}
