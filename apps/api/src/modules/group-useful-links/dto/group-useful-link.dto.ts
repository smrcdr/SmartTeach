import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { FileObjectDto } from '../../files/dto/file-object.dto'

export class GroupUsefulLinkDto {
  @ApiProperty({
    format: 'uuid',
    example: 'ddddddd4-dddd-4ddd-8ddd-dddddddddddd',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string

  @ApiProperty({
    minLength: 1,
    maxLength: 120,
    example: 'Телеграм',
  })
  title!: string

  @ApiProperty({
    format: 'uri',
    example: 'https://t.me/test123',
  })
  url!: string

  @ApiPropertyOptional({
    type: () => FileObjectDto,
    nullable: true,
  })
  image!: FileObjectDto | null

  @ApiProperty({
    minimum: 1,
    example: 10,
  })
  sortOrder!: number

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
