import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class CreateMaterialSectionRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200),
      sortOrder: z.number().int().min(1).optional(),
    })
    .strict()

  @ApiProperty({
    minLength: 2,
    maxLength: 200,
    example: 'HTML и структура страницы',
  })
  title!: string

  @ApiPropertyOptional({
    minimum: 1,
    example: 1,
  })
  sortOrder?: number
}
