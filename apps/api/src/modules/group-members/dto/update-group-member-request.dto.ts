import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'
import { groupRoleSchema, groupRoleValues } from '../../groups/groups.schemas'

export class UpdateGroupMemberRequestDto {
  static schema = z
    .object({
      role: groupRoleSchema,
    })
    .strict()

  @ApiProperty({
    enum: groupRoleValues,
    example: 'USER',
  })
  role!: (typeof groupRoleValues)[number]
}
