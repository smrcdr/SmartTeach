import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export class RefreshTokenRequestDto {
  static schema = z
    .object({
      refreshToken: z.string().min(1),
    })
    .strict()

  @ApiProperty()
  refreshToken!: string
}
