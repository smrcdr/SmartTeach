import type { Prisma } from '@prisma/client'
import { PublicUserDto } from './dto/public-user.dto'
import { UserDto } from './dto/user.dto'
import type { AvatarUrlByFileId } from './user-avatar.utils'

const avatarFileSelect = {
  deletedAt: true,
  storageKey: true,
} satisfies Prisma.FileSelect

export const userSelect = {
  id: true,
  email: true,
  displayName: true,
  bio: true,
  avatarFileId: true,
  avatarFile: {
    select: avatarFileSelect,
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export const publicUserSelect = {
  id: true,
  displayName: true,
  bio: true,
  avatarFileId: true,
  avatarFile: {
    select: avatarFileSelect,
  },
} satisfies Prisma.UserSelect

export const authUserSelect = {
  ...userSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect

export type UserRecord = Prisma.UserGetPayload<{
  select: typeof userSelect
}>

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect
}>

export type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof authUserSelect
}>

type UserDtoSource = {
  id: string
  email: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
  avatarFile: {
    deletedAt: Date | null
    storageKey: string
  } | null
  createdAt: Date
  updatedAt: Date
}

type PublicUserDtoSource = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
  avatarFile: {
    deletedAt: Date | null
    storageKey: string
  } | null
}

function resolveAvatarFileId(user: {
  avatarFileId: string | null
  avatarFile: {
    deletedAt: Date | null
    storageKey?: string
  } | null
}) {
  if (!user.avatarFileId) {
    return null
  }

  return user.avatarFile?.deletedAt === null ? user.avatarFileId : null
}

function resolveAvatarUrl(
  user: {
    avatarFileId: string | null
    avatarFile: {
      deletedAt: Date | null
      storageKey?: string
    } | null
  },
  avatarUrlByFileId?: AvatarUrlByFileId,
) {
  const avatarFileId = resolveAvatarFileId(user)

  if (!avatarFileId) {
    return null
  }

  return avatarUrlByFileId?.get(avatarFileId) ?? null
}

export function mapUserToDto(user: UserDtoSource, avatarUrlByFileId?: AvatarUrlByFileId): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: resolveAvatarFileId(user),
    avatarUrl: resolveAvatarUrl(user, avatarUrlByFileId),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export function mapPublicUserToDto(
  user: PublicUserDtoSource,
  avatarUrlByFileId?: AvatarUrlByFileId,
): PublicUserDto {
  return {
    id: user.id,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: resolveAvatarFileId(user),
    avatarUrl: resolveAvatarUrl(user, avatarUrlByFileId),
  }
}
