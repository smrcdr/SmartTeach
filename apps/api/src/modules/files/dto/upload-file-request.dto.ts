import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

const folderPattern = /^[a-z0-9]+(?:[a-z0-9/_-]*[a-z0-9])?$/

export class UploadFileRequestDto {
  static schema = z
    .object({
      folder: z.string().trim().min(1).max(80).regex(folderPattern).optional(),
    })
    .strict()

  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  file!: unknown

  @ApiPropertyOptional({
    description: 'Логическая папка хранения, например avatars, lessons или messages.',
    example: 'avatars',
  })
  folder?: string
}
