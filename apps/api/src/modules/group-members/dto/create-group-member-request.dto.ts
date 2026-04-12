import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { z } from 'zod'
import { groupRoleSchema, groupRoleValues } from '../../groups/groups.schemas'

export class CreateGroupMemberRequestDto {
  static schema = z
    .object({
      userId: z.string().uuid(),
      role: groupRoleSchema.optional(),
    })
    .strict()

  @ApiProperty({
    format: 'uuid',
    example: '33333333-3333-4333-8333-333333333333',
  })
  userId!: string

  @ApiPropertyOptional({
    enum: groupRoleValues,
    example: 'ADMIN',
  })
  role?: (typeof groupRoleValues)[number]
}
