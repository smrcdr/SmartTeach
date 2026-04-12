import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PublicUserDto } from '../../users/dto/public-user.dto'
import { joinRequestStatusValues } from '../../groups/groups.schemas'

export class GroupJoinRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: '99999999-9999-4999-8999-999999999999',
  })
  id!: string

  @ApiProperty({
    format: 'uuid',
    example: '77777777-7777-4777-8777-777777777777',
  })
  groupId!: string

  @ApiProperty({
    format: 'uuid',
    example: '33333333-3333-4333-8333-333333333333',
  })
  userId!: string

  @ApiProperty({
    enum: joinRequestStatusValues,
    example: 'PENDING',
  })
  status!: (typeof joinRequestStatusValues)[number]

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
  })
  reviewedByUserId!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  reviewedAt!: string | null

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string

  @ApiProperty({
    type: () => PublicUserDto,
  })
  user!: PublicUserDto

  @ApiPropertyOptional({
    type: () => PublicUserDto,
    nullable: true,
  })
  reviewer!: PublicUserDto | null
}
