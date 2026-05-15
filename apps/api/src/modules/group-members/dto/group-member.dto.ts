import { ApiProperty } from '@nestjs/swagger'
import { PublicUserDto } from '../../users/dto/public-user.dto'
import { groupRoleValues } from '../../groups/groups.schemas'

export class GroupMemberDto {
  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  groupId!: string

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  userId!: string

  @ApiProperty({
    enum: groupRoleValues,
    example: 'ADMIN',
  })
  role!: (typeof groupRoleValues)[number]

  @ApiProperty({
    format: 'date-time',
  })
  joinedAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string

  @ApiProperty({
    type: () => PublicUserDto,
  })
  user!: PublicUserDto
}
