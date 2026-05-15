import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export class CreateDirectChatRequestDto {
  static schema = z
    .object({
      userId: z.string().uuid(),
    })
    .strict()

  @ApiProperty({
    format: 'uuid',
    example: '33333333-3333-4333-8333-333333333333',
  })
  userId!: string
}
