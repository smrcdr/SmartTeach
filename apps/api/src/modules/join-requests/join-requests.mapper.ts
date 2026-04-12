import type { Prisma } from '@prisma/client'
import { mapPublicUserToDto, publicUserSelect } from '../users/users.mapper'
import { GroupJoinRequestDto } from './dto/group-join-request.dto'

export const groupJoinRequestSelect = {
  id: true,
  groupId: true,
  userId: true,
  status: true,
  reviewedByUserId: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: publicUserSelect,
  },
  reviewedByUser: {
    select: publicUserSelect,
  },
} satisfies Prisma.GroupJoinRequestSelect

export type GroupJoinRequestRecord = Prisma.GroupJoinRequestGetPayload<{
  select: typeof groupJoinRequestSelect
}>

export function mapGroupJoinRequestToDto(request: GroupJoinRequestRecord): GroupJoinRequestDto {
  return {
    id: request.id,
    groupId: request.groupId,
    userId: request.userId,
    status: request.status,
    reviewedByUserId: request.reviewedByUserId,
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    user: mapPublicUserToDto(request.user),
    reviewer: request.reviewedByUser ? mapPublicUserToDto(request.reviewedByUser) : null,
  }
}
