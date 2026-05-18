import type { Prisma } from '@prisma/client'
import { MinioService } from '../../storage/minio/minio.service'
import { mapPublicUserToDto, publicUserSelect } from '../users/users.mapper'
import type { AvatarUrlByFileId } from '../users/user-avatar.utils'
import { GroupDto } from './dto/group.dto'
import { GroupSettingsDto } from './dto/group-settings.dto'

const ANONYMOUS_VIEWER_USER_ID = '00000000-0000-0000-0000-000000000000'

export const groupSettingsSelect = {
  chatEnabled: true,
  lessonsEnabled: true,
  assignmentsEnabled: true,
  scheduleEnabled: true,
  scheduleWeeklyEnabled: true,
  scheduleSpecialEnabled: true,
  usefulLinksEnabled: true,
} satisfies Prisma.GroupSettingsSelect

const groupBaseSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  avatarFileId: true,
  avatarFile: {
    select: {
      deletedAt: true,
      storageKey: true,
    },
  },
  catalogImageFileId: true,
  catalogImageFile: {
    select: {
      deletedAt: true,
      storageKey: true,
    },
  },
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

export function buildGroupSelect(userId: string | null) {
  const viewerUserId = userId ?? ANONYMOUS_VIEWER_USER_ID

  return {
    ...groupBaseSelect,
    members: {
      where: {
        userId: viewerUserId,
      },
      select: groupViewerMembershipSelect,
      take: 1,
    },
    joinRequests: {
      where: {
        userId: viewerUserId,
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

export type GroupImageUrlByFileId = ReadonlyMap<string, string>

export function mapGroupSettingsToDto(settings: GroupSettingsRecord): GroupSettingsDto {
  return {
    chatEnabled: settings.chatEnabled,
    lessonsEnabled: settings.lessonsEnabled,
    assignmentsEnabled: settings.assignmentsEnabled,
    scheduleEnabled: settings.scheduleEnabled,
    scheduleWeeklyEnabled: settings.scheduleWeeklyEnabled,
    scheduleSpecialEnabled: settings.scheduleSpecialEnabled,
    usefulLinksEnabled: settings.usefulLinksEnabled,
  }
}

export async function buildGroupImageUrlByFileId(
  minioService: MinioService,
  groups: Array<Pick<GroupRecord, 'avatarFileId' | 'avatarFile' | 'catalogImageFileId' | 'catalogImageFile'>>,
): Promise<Map<string, string>> {
  const imageFiles = Array.from(
    new Map(
      groups.flatMap((group) => {
        const entries: Array<readonly [string, string]> = []

        if (group.avatarFileId && group.avatarFile?.deletedAt === null && group.avatarFile.storageKey) {
          entries.push([group.avatarFileId, group.avatarFile.storageKey] as const)
        }

        if (
          group.catalogImageFileId &&
          group.catalogImageFile?.deletedAt === null &&
          group.catalogImageFile.storageKey
        ) {
          entries.push([group.catalogImageFileId, group.catalogImageFile.storageKey] as const)
        }

        return entries
      }),
    ).entries(),
  )

  if (imageFiles.length === 0) {
    return new Map()
  }

  const urls = await Promise.all(
    imageFiles.map(([, storageKey]) => minioService.getObjectUrl(storageKey)),
  )

  return new Map(
    imageFiles.map(([fileId], index) => [fileId, urls[index] ?? '']),
  )
}

export function mapGroupToDto(
  group: GroupRecord,
  avatarUrlByFileId?: AvatarUrlByFileId,
  groupImageUrlByFileId?: GroupImageUrlByFileId,
): GroupDto {
  if (!group.settings) {
    throw new Error(`Group ${group.id} is missing settings`)
  }

  return {
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    avatarFileId: group.avatarFileId,
    avatarUrl: group.avatarFileId ? groupImageUrlByFileId?.get(group.avatarFileId) ?? null : null,
    catalogImageFileId: group.catalogImageFileId,
    catalogImageUrl: group.catalogImageFileId ? groupImageUrlByFileId?.get(group.catalogImageFileId) ?? null : null,
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
