import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PublicUserDto } from '../../users/dto/public-user.dto'

export class ChatMemberDto {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  userId!: string

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-12T10:00:00.000Z',
  })
  joinedAt!: string

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    example: '2026-04-12T11:30:00.000Z',
  })
  lastReadAt!: string | null

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-12T10:00:00.000Z',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
    example: '2026-04-12T11:30:00.000Z',
  })
  updatedAt!: string

  @ApiProperty({
    type: PublicUserDto,
  })
  user!: PublicUserDto
}
