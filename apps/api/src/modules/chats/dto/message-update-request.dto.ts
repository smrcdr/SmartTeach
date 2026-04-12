import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class MessageUpdateRequestDto {
  static schema = z
    .object({
      text: z.string().optional(),
      fileIds: z.array(z.string().uuid()).optional(),
    })
    .strict()

  @ApiPropertyOptional({
    example: 'Обновил текст сообщения после проверки вложения.',
  })
  text?: string

  @ApiPropertyOptional({
    type: [String],
    example: ['aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6'],
  })
  fileIds?: string[]
}
