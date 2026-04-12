import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export class GroupChatCreateRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(150),
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 150,
    example: 'Общий чат Web Basics',
  })
  title!: string
}
