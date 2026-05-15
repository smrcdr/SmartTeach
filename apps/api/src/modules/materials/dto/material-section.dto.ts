import { ApiProperty } from '@nestjs/swagger'

export class MaterialSubsectionDto {
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
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
  })
  sectionId!: string

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Семантическая верстка',
  })
  title!: string

  @ApiProperty({
    minimum: 1,
    example: 1,
  })
  sortOrder!: number

  @ApiProperty({
    minimum: 0,
    example: 3,
  })
  lessonsCount!: number

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  createdByUserId!: string

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string
}

export class MaterialSectionDto {
  @ApiProperty({
    format: 'uuid',
    example: '88888888-8888-4888-8888-888888888888',
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
    example: 'HTML и структура страницы',
  })
  title!: string

  @ApiProperty({
    minimum: 1,
    example: 1,
  })
  sortOrder!: number

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  createdByUserId!: string

  @ApiProperty({
    type: () => MaterialSubsectionDto,
    isArray: true,
  })
  subsections!: MaterialSubsectionDto[]

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string
}
