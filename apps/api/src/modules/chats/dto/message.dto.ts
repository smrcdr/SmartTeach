import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { FileObjectDto } from '../../files/dto/file-object.dto'
import { PublicUserDto } from '../../users/dto/public-user.dto'

export class MessageDto {
  @ApiProperty({
    format: 'uuid',
    example: '12121212-1212-4212-8212-121212121212',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
  })
  chatId!: string

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  authorId!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Закрепил материалы к уроку.',
  })
  text!: string | null

  @ApiProperty({
    type: [FileObjectDto],
  })
  files!: FileObjectDto[]

  @ApiPropertyOptional({
    type: () => MessageReplyDto,
    nullable: true,
  })
  replyToMessage!: MessageReplyDto | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    example: '2026-04-12T11:35:00.000Z',
  })
  editedAt!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    example: '2026-04-12T12:10:00.000Z',
  })
  deletedAt!: string | null

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-12T11:30:00.000Z',
  })
  createdAt!: string

  @ApiProperty({
    type: PublicUserDto,
  })
  author!: PublicUserDto
}

export class MessageReplyDto {
  @ApiProperty({
    format: 'uuid',
    example: '12121212-1212-4212-8212-121212121212',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  authorId!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Закрепил материалы к уроку.',
  })
  text!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    example: '2026-04-12T12:10:00.000Z',
  })
  deletedAt!: string | null

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-12T11:30:00.000Z',
  })
  createdAt!: string

  @ApiProperty({
    type: PublicUserDto,
  })
  author!: PublicUserDto
}
