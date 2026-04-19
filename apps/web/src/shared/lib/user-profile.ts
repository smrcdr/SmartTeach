import type { components } from '../api/generated/openapi'

type RawPublicUser = components['schemas']['PublicUser']
type RawUser = components['schemas']['User']

export type PublicProfile = Omit<RawPublicUser, 'bio' | 'avatarFileId' | 'avatarUrl'> & {
  bio: string | null
  avatarFileId: string | null
  avatarUrl: string | null
}

export type UserProfile = Omit<RawUser, 'bio' | 'avatarFileId' | 'avatarUrl'> & {
  bio: string | null
  avatarFileId: string | null
  avatarUrl: string | null
}

export function normalizePublicProfile(profile: RawPublicUser): PublicProfile {
  return {
    ...profile,
    bio: normalizeNullableString(profile.bio),
    avatarFileId: normalizeNullableString(profile.avatarFileId),
    avatarUrl: normalizeNullableString(profile.avatarUrl),
  }
}

export function normalizeUserProfile(profile: RawUser): UserProfile {
  return {
    ...profile,
    bio: normalizeNullableString(profile.bio),
    avatarFileId: normalizeNullableString(profile.avatarFileId),
    avatarUrl: normalizeNullableString(profile.avatarUrl),
  }
}

export function toPublicProfile(profile: Pick<UserProfile, 'id' | 'displayName' | 'bio' | 'avatarFileId' | 'avatarUrl'>) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarFileId: profile.avatarFileId,
    avatarUrl: profile.avatarUrl,
  } satisfies PublicProfile
}

export function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

export function getUserInitials(value: string) {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return 'ST'
  }

  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')

  return initials || normalized.slice(0, 2).toUpperCase()
}
