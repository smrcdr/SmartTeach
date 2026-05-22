import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class UpdateGroupUsefulLinkRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(1).max(120).optional(),
      url: z.string().trim().url().max(2048).optional(),
    })
    .strict()
    .refine((value) => value.title !== undefined || value.url !== undefined, {
      message: 'At least one field must be provided',
    })

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 120,
    example: 'Телеграм',
  })
  title?: string

  @ApiPropertyOptional({
    format: 'uri',
    maxLength: 2048,
    example: 'https://t.me/test123',
  })
  url?: string
}
