import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class UpdateMaterialSubsectionRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      sortOrder: z.number().int().min(1).optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 200,
    example: 'Семантическая верстка',
  })
  title?: string

  @ApiPropertyOptional({
    minimum: 1,
    example: 1,
  })
  sortOrder?: number
}
