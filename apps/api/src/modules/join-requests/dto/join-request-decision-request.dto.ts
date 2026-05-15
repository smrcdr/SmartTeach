import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'
import { joinRequestDecisionSchema, joinRequestDecisionValues } from '../../groups/groups.schemas'

export class JoinRequestDecisionRequestDto {
  static schema = z
    .object({
      decision: joinRequestDecisionSchema,
    })
    .strict()

  @ApiProperty({
    enum: joinRequestDecisionValues,
    example: 'APPROVED',
  })
  decision!: (typeof joinRequestDecisionValues)[number]
}
