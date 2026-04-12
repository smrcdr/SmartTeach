import type { Prisma } from '@prisma/client'
import { PublicUserDto } from './dto/public-user.dto'
import { UserDto } from './dto/user.dto'

export const userSelect = {
  id: true,
  email: true,
  displayName: true,
  bio: true,
  avatarFileId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export const publicUserSelect = {
  id: true,
  displayName: true,
  bio: true,
  avatarFileId: true,
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
  createdAt: Date
  updatedAt: Date
}

type PublicUserDtoSource = {
  id: string
  displayName: string
  bio: string | null
  avatarFileId: string | null
}

export function mapUserToDto(user: UserDtoSource): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: user.avatarFileId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export function mapPublicUserToDto(user: PublicUserDtoSource): PublicUserDto {
  return {
    id: user.id,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: user.avatarFileId,
  }
}
