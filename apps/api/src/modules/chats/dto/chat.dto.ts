import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { chatTypeValues } from '../chats.schemas'
import { ChatMemberDto } from './chat-member.dto'

export class ChatDto {
  @ApiProperty({
    format: 'uuid',
    example: 'fffffff1-ffff-4fff-8fff-fffffffffff1',
  })
  id!: string

  @ApiProperty({
    enum: chatTypeValues,
    example: 'GROUP',
  })
  chatType!: (typeof chatTypeValues)[number]

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string | null

  @ApiPropertyOptional({
    nullable: true,
    example: 'Общий чат Web Basics',
  })
  title!: string | null

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  createdByUserId!: string

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    example: '2026-04-12T11:30:00.000Z',
  })
  lastMessageAt!: string | null

  @ApiProperty({
    type: [ChatMemberDto],
  })
  members!: ChatMemberDto[]

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
}
