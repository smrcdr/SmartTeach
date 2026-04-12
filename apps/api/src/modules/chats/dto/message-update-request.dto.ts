import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export class MessageUpdateRequestDto {
  static schema = z
    .object({
      text: z.string(),
    })
    .strict()

  @ApiProperty({
    example: 'Обновил текст сообщения после проверки вложения.',
  })
  text!: string
}
