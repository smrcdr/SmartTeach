import type { Prisma } from '@prisma/client'
import { mapPublicUserToDto, publicUserSelect } from '../users/users.mapper'
import type { AvatarUrlByFileId } from '../users/user-avatar.utils'
import { GroupDto } from './dto/group.dto'
import { GroupSettingsDto } from './dto/group-settings.dto'

export const groupSettingsSelect = {
  chatEnabled: true,
  lessonsEnabled: true,
  assignmentsEnabled: true,
  scheduleEnabled: true,
} satisfies Prisma.GroupSettingsSelect

const groupBaseSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  ownerId: true,
  owner: {
    select: publicUserSelect,
  },
  accessMode: true,
  status: true,
  settings: {
    select: groupSettingsSelect,
  },
  _count: {
    select: {
      members: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  deletedAt: true,
} satisfies Prisma.GroupSelect

const groupViewerMembershipSelect = {
  role: true,
} satisfies Prisma.GroupMemberSelect

const groupViewerJoinRequestSelect = {
  status: true,
} satisfies Prisma.GroupJoinRequestSelect

export function buildGroupSelect(userId: string) {
  return {
    ...groupBaseSelect,
    members: {
      where: {
        userId,
      },
      select: groupViewerMembershipSelect,
      take: 1,
    },
    joinRequests: {
      where: {
        userId,
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      select: groupViewerJoinRequestSelect,
      take: 1,
    },
  } satisfies Prisma.GroupSelect
}

export type GroupSettingsRecord = Prisma.GroupSettingsGetPayload<{
  select: typeof groupSettingsSelect
}>

export type GroupRecord = Prisma.GroupGetPayload<{
  select: ReturnType<typeof buildGroupSelect>
}>

export function mapGroupSettingsToDto(settings: GroupSettingsRecord): GroupSettingsDto {
  return {
    chatEnabled: settings.chatEnabled,
    lessonsEnabled: settings.lessonsEnabled,
    assignmentsEnabled: settings.assignmentsEnabled,
    scheduleEnabled: settings.scheduleEnabled,
  }
}

export function mapGroupToDto(group: GroupRecord, avatarUrlByFileId?: AvatarUrlByFileId): GroupDto {
  if (!group.settings) {
    throw new Error(`Group ${group.id} is missing settings`)
  }

  return {
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    ownerId: group.ownerId,
    owner: mapPublicUserToDto(group.owner, avatarUrlByFileId),
    accessMode: group.accessMode,
    status: group.status,
    settings: mapGroupSettingsToDto(group.settings),
    membersCount: group._count.members,
    viewerMembershipRole: group.members[0]?.role ?? null,
    viewerJoinRequestStatus: group.joinRequests[0]?.status ?? null,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
    archivedAt: group.archivedAt?.toISOString() ?? null,
    deletedAt: group.deletedAt?.toISOString() ?? null,
  }
}
