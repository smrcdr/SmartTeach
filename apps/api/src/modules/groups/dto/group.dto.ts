import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PublicUserDto } from '../../users/dto/public-user.dto'
import { GroupSettingsDto } from './group-settings.dto'
import {
  groupAccessModeValues,
  groupRoleValues,
  groupStatusValues,
  joinRequestStatusValues,
} from '../groups.schemas'

export class GroupDto {
  @ApiProperty({
    format: 'uuid',
    example: '66666666-6666-4666-8666-666666666666',
  })
  id!: string

  @ApiProperty({
    example: 'WEBSPR1',
  })
  code!: string

  @ApiProperty({
    minLength: 2,
    maxLength: 150,
    example: 'Web Basics Spring 2026',
  })
  name!: string

  @ApiPropertyOptional({
    nullable: true,
    example: 'Открытая группа для отработки HTML, CSS и базового JavaScript.',
  })
  description!: string | null

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  ownerId!: string

  @ApiProperty({
    type: () => PublicUserDto,
  })
  owner!: PublicUserDto

  @ApiProperty({
    enum: groupAccessModeValues,
    example: 'OPEN',
  })
  accessMode!: (typeof groupAccessModeValues)[number]

  @ApiProperty({
    enum: groupStatusValues,
    example: 'ACTIVE',
  })
  status!: (typeof groupStatusValues)[number]

  @ApiProperty({
    type: () => GroupSettingsDto,
  })
  settings!: GroupSettingsDto

  @ApiProperty({
    minimum: 0,
    example: 3,
  })
  membersCount!: number

  @ApiPropertyOptional({
    enum: groupRoleValues,
    nullable: true,
    description: 'Роль текущего пользователя в группе, если он уже состоит в ней.',
    example: 'USER',
  })
  viewerMembershipRole!: (typeof groupRoleValues)[number] | null

  @ApiPropertyOptional({
    enum: joinRequestStatusValues,
    nullable: true,
    description: 'Последний известный статус заявки текущего пользователя в эту группу.',
    example: 'PENDING',
  })
  viewerJoinRequestStatus!: (typeof joinRequestStatusValues)[number] | null

  @ApiProperty({
    format: 'date-time',
  })
  createdAt!: string

  @ApiProperty({
    format: 'date-time',
  })
  updatedAt!: string

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  archivedAt!: string | null

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
  })
  deletedAt!: string | null
}
