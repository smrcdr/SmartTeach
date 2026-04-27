import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { FileObjectDto } from '../../files/dto/file-object.dto'
import { lessonStatusValues } from '../lessons.schemas'

export class LessonDto {
  @ApiProperty({
    format: 'uuid',
    example: '77777777-7777-4777-8777-777777777777',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: '99999999-9999-4999-8999-999999999999',
  })
  materialSubsectionId!: string | null

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'Intro to REST contracts',
  })
  title!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Разбираем базовую структуру REST API и договоренности по payload.',
  })
  content!: string | null

  @ApiProperty({
    enum: lessonStatusValues,
    example: 'PUBLISHED',
  })
  status!: (typeof lessonStatusValues)[number]

  @ApiProperty({
    minimum: 1,
    example: 10,
  })
  sortOrder!: number

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  publishedAt!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  archivedAt!: string | null

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  createdByUserId!: string

  @ApiProperty({
    type: () => FileObjectDto,
    isArray: true,
  })
  files!: FileObjectDto[]

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string
}
