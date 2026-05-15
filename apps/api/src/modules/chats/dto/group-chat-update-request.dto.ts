import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class GroupChatUpdateRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(150).optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 150,
    example: 'Чат для организационных вопросов',
  })
  title?: string
}
