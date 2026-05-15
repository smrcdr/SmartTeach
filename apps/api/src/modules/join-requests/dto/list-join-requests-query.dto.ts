import { ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { joinRequestStatusSchema, joinRequestStatusValues } from '../../groups/groups.schemas'

function normalizeOptionalUppercaseString(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim().toUpperCase()

  return normalized.length > 0 ? normalized : undefined
}

export class ListJoinRequestsQueryDto {
  static schema = z
    .object({
      status: z.preprocess(normalizeOptionalUppercaseString, joinRequestStatusSchema.optional()),
    })
    .strict()

  @ApiPropertyOptional({
    enum: joinRequestStatusValues,
    example: 'PENDING',
  })
  status?: (typeof joinRequestStatusValues)[number]
}
