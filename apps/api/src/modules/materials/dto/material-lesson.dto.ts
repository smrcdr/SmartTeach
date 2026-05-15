import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { lessonStatusValues } from '../../lessons/lessons.schemas'

export class MaterialLessonDto {
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
    example: 'Введение в структуру страницы',
  })
  title!: string

  @ApiProperty({
    enum: lessonStatusValues,
    example: 'PUBLISHED',
  })
  status!: (typeof lessonStatusValues)[number]

  @ApiProperty({
    minimum: 1,
    example: 1,
  })
  sortOrder!: number

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string
}
