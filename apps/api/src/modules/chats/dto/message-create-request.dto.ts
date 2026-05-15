import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

export class MessageCreateRequestDto {
  static schema = z
    .object({
      text: z.preprocess(normalizeOptionalString, z.string().optional()),
      fileIds: z.array(z.string().uuid()).optional(),
      replyToMessageId: z.string().uuid().optional(),
    })
    .strict()
    .refine((value) => value.text !== undefined || (value.fileIds?.length ?? 0) > 0, {
      message: 'Message must contain text or at least one attachment',
      path: ['text'],
    })

  @ApiPropertyOptional({
    example: 'Проверьте, пожалуйста, последний макет.',
  })
  text?: string

  @ApiPropertyOptional({
    type: [String],
    example: ['aaaaaaa6-aaaa-4aaa-8aaa-aaaaaaaaaaa6'],
  })
  fileIds?: string[]

  @ApiPropertyOptional({
    format: 'uuid',
    example: '12121212-1212-4212-8212-121212121212',
  })
  replyToMessageId?: string
}
