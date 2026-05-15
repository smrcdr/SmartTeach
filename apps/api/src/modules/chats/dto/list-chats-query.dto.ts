import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { chatTypeSchema, chatTypeValues } from '../chats.schemas'

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : undefined
}

function normalizeOptionalUppercaseString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim().toUpperCase()

  return normalized.length > 0 ? normalized : undefined
}

export class ListChatsQueryDto {
  static schema = z
    .object({
      chatType: z.preprocess(normalizeOptionalUppercaseString, chatTypeSchema.optional()),
      groupId: z.preprocess(normalizeOptionalString, z.string().uuid().optional()),
    })
    .strict()

  @ApiPropertyOptional({
    enum: chatTypeValues,
    example: 'GROUP',
  })
  chatType?: (typeof chatTypeValues)[number]

  @ApiPropertyOptional({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId?: string
}
