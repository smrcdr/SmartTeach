import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export class LoginRequestDto {
  static schema = z
    .object({
      email: z
        .string()
        .trim()
        .email()
        .transform((value) => value.toLowerCase()),
      password: z.string().min(1),
    })
    .strict()

  @ApiProperty({
    format: 'email',
    example: 'student@smarteach.local',
  })
  email!: string

  @ApiProperty({
    example: 'Password123!',
  })
  password!: string
}
