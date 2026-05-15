import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class CreateGroupUsefulLinkRequestDto {
  static schema = z
    .object({
      title: z.string().trim().min(1).max(120),
      url: z.string().trim().url().max(2048),
      imageFileId: z.string().uuid().nullable().optional(),
      sortOrder: z.number().int().min(1).optional(),
    })
    .strict()

  @ApiProperty({
    minLength: 1,
    maxLength: 120,
    example: 'Телеграм',
  })
  title!: string

  @ApiProperty({
    format: 'uri',
    maxLength: 2048,
    example: 'https://t.me/test123',
  })
  url!: string

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    nullable: true,
    example: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  })
  imageFileId?: string | null

  @ApiPropertyOptional({
    minimum: 1,
    example: 10,
  })
  sortOrder?: number
}
