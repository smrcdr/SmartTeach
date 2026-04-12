import type { Prisma } from '@prisma/client'
import { mapPublicUserToDto, publicUserSelect } from '../users/users.mapper'
import type { AvatarUrlByFileId } from '../users/user-avatar.utils'
import { GroupMemberDto } from './dto/group-member.dto'

export const groupMemberSelect = {
  groupId: true,
  userId: true,
  role: true,
  joinedAt: true,
  updatedAt: true,
  user: {
    select: publicUserSelect,
  },
} satisfies Prisma.GroupMemberSelect

export type GroupMemberRecord = Prisma.GroupMemberGetPayload<{
  select: typeof groupMemberSelect
}>

export function mapGroupMemberToDto(
  member: GroupMemberRecord,
  avatarUrlByFileId?: AvatarUrlByFileId,
): GroupMemberDto {
  return {
    groupId: member.groupId,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
    user: mapPublicUserToDto(member.user, avatarUrlByFileId),
  }
}
