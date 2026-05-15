import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

export class UpdateMyProfileRequestDto {
  static schema = z
    .object({
      displayName: z.string().trim().min(2).max(100).optional(),
      bio: z.string().trim().max(1000).optional(),
      avatarFileId: z.string().uuid().nullable().optional(),
    })
    .strict()

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 100,
    example: 'Alex Teacher',
  })
  displayName?: string

  @ApiPropertyOptional({
    maxLength: 1000,
    example: 'Преподает веб-разработку и ведет открытые учебные группы.',
  })
  bio?: string

  @ApiPropertyOptional({
    format: 'uuid',
    example: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    nullable: true,
  })
  avatarFileId?: string | null
}
