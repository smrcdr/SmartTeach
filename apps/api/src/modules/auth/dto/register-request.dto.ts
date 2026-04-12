import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase())

export class RegisterRequestDto {
  static schema = z
    .object({
      email: emailSchema,
      password: z.string().min(8),
      displayName: z.string().trim().min(2).max(100),
    })
    .strict()

  @ApiProperty({
    format: 'email',
    example: 'student@smarteach.local',
  })
  email!: string

  @ApiProperty({
    minLength: 8,
    example: 'Password123!',
  })
  password!: string

  @ApiProperty({
    minLength: 2,
    maxLength: 100,
    example: 'Student Example',
  })
  displayName!: string
}
